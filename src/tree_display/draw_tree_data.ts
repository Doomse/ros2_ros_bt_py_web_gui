/*
 * Copyright 2026 FZI Forschungszentrum Informatik
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *
 *    * Neither the name of the {copyright_holder} nor the names of its
 *      contributors may be used to endorse or promote products derived from
 *      this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
import { useEditorStore } from '@/stores/editor'
import type {
  DataEdgePoint,
  DataEdgeTerminal,
  DataEdge,
  NodeDataLocation,
  BTEditorNode,
  TrimmedNodeData,
  Wiring,
  UUIDString
} from '@/types/types'
import { IOKind } from '@/types/types'
import { prettyprint_type, replaceNameIdParts, typesCompatible } from '@/utils'
import * as d3 from 'd3'
import type { FlextreeNode } from 'd3-flextree'
import * as uuid from 'uuid'
import { rosToUuid } from '@/utils'
import {
  data_vert_group_css_class,
  data_vert_label_css_class,
  data_vert_label_type_css_class,
  io_gripper_size,
  io_gripper_spacing,
  data_graph_comaptible_css_class,
  data_graph_hover_css_class,
  data_vert1_highlight_css_id,
  data_vert_grip_css_class,
  data_edge_css_class,
  data_vert2_highlight_css_id,
  data_edge_highlight_css_id,
  io_edge_bump_thresh,
  io_edge_bump_factor,
  io_edge_offset,
  io_edge_curve_factor,
  io_edge_curve_offset
} from './draw_tree_config'
import { findTree } from '../tree_selection'
import { addDataEdge } from '@/tree_manipulation'

// Calculates vertical offsets for data vertices based on a shared prefix
//   also returns an extra offset at the end to give an indication of the total height.
export function getDataVertOffsets(data_list: TrimmedNodeData[]): number[] {
  let vertical_offset = io_gripper_spacing
  let previous_prefix = ''
  const offsets = data_list.map((data, index) => {
    const key_prefix = data.key.split('.').slice(0, -1).join('.')
    if (key_prefix !== previous_prefix && index > 0) {
      vertical_offset += io_gripper_spacing
    }
    const old_vertical_offset = vertical_offset
    vertical_offset += io_gripper_size + io_gripper_spacing
    previous_prefix = key_prefix
    return old_vertical_offset
  })
  offsets.push(vertical_offset)
  return offsets
}

export function drawDataLine(source: DataEdgePoint, target: DataEdgePoint) {
  const lineGen = d3
    .line<DataEdgePoint>()
    .x((p) => p.x + io_gripper_size / 2)
    .y((p) => p.y + io_gripper_size / 2)
    .curve(d3.curveCatmullRom.alpha(0.9))
  let y_offset = 0
  if (Math.abs(source.y - target.y) < io_edge_bump_thresh) {
    y_offset = Math.min(source.y, target.y) - io_edge_bump_factor * Math.abs(source.x - target.x)
  }
  const source_offset: DataEdgePoint = {
    x: source.x + io_edge_offset,
    y: source.y
  }
  const target_offset: DataEdgePoint = {
    x: target.x - io_edge_offset,
    y: target.y
  }
  const midpoint: DataEdgePoint = {
    x: (source.x + target.x) / 2,
    y: y_offset ? y_offset : (source.y + target.y) / 2
  }
  // Backwards edges require some extra work
  if (source.x > target.x) {
    if (y_offset === 0) {
      source_offset.y +=
        io_edge_curve_factor * (target.y - source.y) +
        Math.sign(target.y - source.y) * io_edge_curve_offset
      target_offset.y +=
        io_edge_curve_factor * (source.y - target.y) +
        Math.sign(source.y - target.y) * io_edge_curve_offset
    } else {
      const curve_offset =
        io_edge_curve_offset + io_edge_curve_factor * Math.abs(source.x - target.x)
      source_offset.y -= curve_offset
      midpoint.y -= curve_offset * 4
      target_offset.y -= curve_offset
    }
  }
  return lineGen([source, source_offset, midpoint, target_offset, target])
}

function drawNewDataVert(
  selection: d3.Selection<d3.EnterElement, DataEdgeTerminal, SVGGElement, unknown>,
  draw_indicator: SVGPathElement
) {
  const editor_store = useEditorStore()

  const groups = selection
    .append('g')
    .classed(data_vert_group_css_class, true)
    .on('mouseover.highlight', function () {
      if (editor_store.is_dragging) {
        // Highlight compatible vertices when dragging
        const compat = d3.select(this).classed(data_graph_comaptible_css_class)
        d3.select(this).classed(data_graph_hover_css_class, compat)
        d3.select(draw_indicator).classed(data_graph_hover_css_class, compat)
      } else {
        d3.select(this)
          .classed(data_graph_hover_css_class, true)
          .attr('id', data_vert1_highlight_css_id)
          .select('.' + data_vert_label_css_class)
          .attr('visibility', 'visible')
      }
    })
    .on('mouseout.highlight', function () {
      if (editor_store.is_dragging) {
        d3.select(this).classed(data_graph_hover_css_class, false)
        d3.select(draw_indicator).classed(data_graph_hover_css_class, false)
      } else {
        d3.select(this)
          .classed(data_graph_hover_css_class, false)
          .attr('id', null)
          .select('.' + data_vert_label_css_class)
          .attr('visibility', 'hidden')
      }
    })

  groups
    .append('rect')
    .classed(data_vert_grip_css_class, true)
    .attr('width', io_gripper_size)
    .attr('height', io_gripper_size)

  const labels = groups
    .append('text')
    .classed(data_vert_label_css_class, true)
    .attr('dominant-baseline', 'middle')
    .attr('visibility', 'hidden')
    .attr('text-anchor', (d) => (d.kind === IOKind.INPUT ? 'end' : 'start'))
    .attr('x', (d) => {
      switch (d.kind) {
        case IOKind.INPUT:
          return -5
        case IOKind.OUTPUT:
          return io_gripper_size + 5
        case IOKind.OTHER:
        default:
          return 0
      }
    })
    .attr('y', 0.5 * io_gripper_size)

  labels
    .append('tspan')
    .classed(data_vert_label_type_css_class, true)
    .attr('x', function () {
      return d3.select(this.parentElement).attr('x')
    })
    .attr('dy', '1em') // Space out 2nd line

  // The join pattern requires a return of the appended elements
  return groups
}

export class D3TreeDataDisplay {
  readonly tree_id: UUIDString
  readonly editable: boolean
  readonly draw_indicator: SVGPathElement
  readonly vertices_element: d3.Selection<SVGGElement, unknown, null, undefined>
  readonly edges_element: d3.Selection<SVGGElement, unknown, null, undefined>

  tree_transition: d3.Transition<d3.BaseType, unknown, null, undefined> | undefined

  constructor(
    tree_id: UUIDString,
    editable: boolean,
    draw_indicator: SVGPathElement,
    root_element: d3.Selection<SVGGElement, unknown, null, undefined>
  ) {
    this.tree_id = tree_id
    this.editable = editable
    this.draw_indicator = draw_indicator
    this.edges_element = root_element.append('g')
    this.vertices_element = root_element.append('g')
  }

  private prepareTreeData(tree_layout: FlextreeNode<BTEditorNode>): DataEdgeTerminal[] {
    const data_points: DataEdgeTerminal[] = []

    tree_layout.each((node: FlextreeNode<BTEditorNode>) => {
      if (node.data.node_id === uuid.NIL) {
        return
      }

      const input_offsets = getDataVertOffsets(node.data.inputs)
      node.data.inputs.map((input: TrimmedNodeData, index: number) => {
        data_points.push({
          node: node,
          index: index,
          kind: IOKind.INPUT,
          key: input.key,
          type: input.serialized_type,
          x: node.x + node.data.offset.x - node.data.size.width * 0.5 - io_gripper_size,
          y: node.y + node.data.offset.y + input_offsets[index]
        })
      })
      const output_offsets = getDataVertOffsets(node.data.outputs)
      node.data.outputs.map((output: TrimmedNodeData, index: number) => {
        data_points.push({
          node: node,
          index: index,
          kind: IOKind.OUTPUT,
          key: output.key,
          type: output.serialized_type,
          x: node.x + node.data.offset.x + node.data.size.width * 0.5,
          y: node.y + node.data.offset.y + output_offsets[index]
        })
      })
    })

    return data_points
  }

  private drawDataVerts(data_points: DataEdgeTerminal[]) {
    const editor_store = useEditorStore()

    const data_vertices = this.vertices_element
      .selectChildren<SVGGElement, DataEdgeTerminal>('.' + data_vert_group_css_class)
      .data(data_points, (d) => d.node.id! + '###' + d.kind + '###' + d.key)
      .join((enter) => drawNewDataVert(enter, this.draw_indicator))

    // Since descriptions of DataVerts can change, they are added out here
    data_vertices
      .select('.' + data_vert_label_css_class)
      .text((d) => replaceNameIdParts(d.key))
      .select('.' + data_vert_label_type_css_class)
      .text((d) => '(type: ' + prettyprint_type(d.type) + ')')

    if (this.editable) {
      data_vertices
        .on('mousedown.drawedge', (ev, term: DataEdgeTerminal) => {
          if (ev.ctrlKey) {
            return // Do nothing if ctrl is pressed
          }
          editor_store.startDrawingDataEdge(term)
        })
        .on('mouseup.drawedge', (ev, term: DataEdgeTerminal) => {
          if (editor_store.data_edge_endpoint === undefined) {
            console.warn('Unintended data edge draw')
            return
          }

          if (!typesCompatible(term, editor_store.data_edge_endpoint)) {
            console.warn('Invalid edge')
            return
          }

          if (term.kind === IOKind.INPUT) {
            addDataEdge(editor_store.data_edge_endpoint, term)
          } else {
            addDataEdge(term, editor_store.data_edge_endpoint)
          }
        })
    }

    let vertex_transition
    if (this.tree_transition === undefined) {
      vertex_transition = data_vertices
    } else {
      vertex_transition = data_vertices.transition(this.tree_transition)
    }
    vertex_transition
      //NOTE group elements can't be positioned with x= and y=
      .attr('transform', (d) => 'translate(' + d.x + ', ' + d.y + ')')
  }

  private drawDataEdges(data_points: DataEdgeTerminal[]) {
    const editor_store = useEditorStore()

    const tree_structure = findTree(editor_store.tree_structure_list, this.tree_id)

    if (tree_structure === undefined) {
      return
    }

    // This selection is needed for callbacks
    const data_vertices_elems = this.vertices_element.selectChildren<SVGGElement, DataEdgeTerminal>(
      '.' + data_vert_group_css_class
    )

    // Construct edge array by matching tree_msg wirings
    const data_edges: DataEdge[] = []

    function matchEndpoint(wire_point: NodeDataLocation, terminal: DataEdgeTerminal): boolean {
      return (
        rosToUuid(wire_point.node_id) === terminal.node.data.node_id &&
        wire_point.data_kind === terminal.kind &&
        wire_point.data_key === terminal.key
      )
    }

    tree_structure.data_wirings.forEach((wiring: Wiring) => {
      // Match Terminals with wiring data
      const source = data_points.find((term: DataEdgeTerminal) =>
        matchEndpoint(wiring.source, term)
      )
      const target = data_points.find((term: DataEdgeTerminal) =>
        matchEndpoint(wiring.target, term)
      )

      if (source === undefined || target === undefined) {
        console.warn('Bad data edge', source, target)
        return
      }

      // Try to assign output as source and input as target
      if (source.kind === IOKind.INPUT) {
        data_edges.push({
          source: target,
          target: source,
          wiring: wiring
        })
      } else {
        data_edges.push({
          source: source,
          target: target,
          wiring: wiring
        })
      }
    })

    const edge_selection = this.edges_element
      .selectChildren<SVGPathElement, DataEdge>('.' + data_edge_css_class)
      .data(
        data_edges,
        (d: DataEdge) =>
          d.source.node.id! +
          '###' +
          d.source.kind +
          '###' +
          d.source.index +
          '#####' +
          d.target.node.id! +
          '###' +
          d.target.kind +
          '###' +
          d.target.index
      )
      .join('path')
      .classed(data_edge_css_class, true)
      .on('click.select', (event, edge: DataEdge) => {
        if (event.ctrlKey) {
          return // Do nothing if ctrl is pressed
        }
        editor_store.selectEdge(edge.wiring)
        event.stopPropagation()
      })
      .on('mouseover.highlight', function (ev, edge: DataEdge) {
        if (editor_store.is_dragging) {
          return // No highlights while dragging
        }
        data_vertices_elems
          .filter((term: DataEdgeTerminal) => term === edge.source || term === edge.target)
          .dispatch('mouseover')
          .attr('id', (term: DataEdgeTerminal) =>
            term.kind === IOKind.INPUT ? data_vert2_highlight_css_id : data_vert1_highlight_css_id
          )
          //Hide target label
          .select('.' + data_vert_label_css_class)
          .attr('visibility', (term: DataEdgeTerminal) => {
            if (term.kind === IOKind.INPUT) {
              return 'hidden'
            }
            return 'visible'
          })

        d3.select(this)
          .classed(data_graph_hover_css_class, true)
          .attr('id', data_edge_highlight_css_id)
      })
      .on('mouseout.highlight', function (ev, edge: DataEdge) {
        if (editor_store.is_dragging) {
          return // No highlights while dragging
        }
        data_vertices_elems
          .filter((term: DataEdgeTerminal) => term === edge.source || term === edge.target)
          .dispatch('mouseout')
        d3.select(this).classed(data_graph_hover_css_class, false).attr('id', null)
      })
    let edge_transition
    if (this.tree_transition === undefined) {
      edge_transition = edge_selection
    } else {
      edge_transition = edge_selection.transition(this.tree_transition)
    }
    edge_transition.attr('d', (edge: DataEdge) => drawDataLine(edge.source, edge.target))
  }

  public drawTreeData(tree_layout: FlextreeNode<BTEditorNode>) {
    const data_points = this.prepareTreeData(tree_layout)

    this.drawDataVerts(data_points)

    this.drawDataEdges(data_points)
  }

  public highlightCompatibleVertices(other_endpoint: DataEdgeTerminal) {
    this.vertices_element
      .selectChildren<SVGGElement, DataEdgeTerminal>('.' + data_vert_group_css_class)
      .filter((term: DataEdgeTerminal) => typesCompatible(term, other_endpoint))
      .classed(data_graph_comaptible_css_class, true)

    d3.select(this.draw_indicator).attr('d', () => drawDataLine(other_endpoint, other_endpoint))
  }
}
