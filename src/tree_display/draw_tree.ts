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
import { useEditNodeStore } from '@/stores/edit_node'
import type {
  BTEditorNode,
  TrimmedNodeData,
  NodeIO,
  UUIDString,
  DocumentedNode,
  DataEdgeTerminal
} from '@/types/types'
import * as d3 from 'd3'
import type { HierarchyNode, HierarchyLink } from 'd3-hierarchy'
import { flextree, type FlextreeNode } from 'd3-flextree'
import * as uuid from 'uuid'
import { rosToUuid } from '@/utils'
import {
  tree_node_css_class,
  node_body_css_class,
  node_name_css_class,
  node_class_css_class,
  node_state_css_class,
  icon_width,
  node_name_height,
  name_line_length,
  name_first_line_indent,
  node_padding,
  node_class_height,
  class_line_length,
  io_gripper_size,
  io_gripper_spacing,
  node_spacing,
  tree_edge_css_class,
  node_inner_css_class
} from './draw_tree_config'
import { findTree, findTreeContainingNode, getNodeStructures } from '../tree_selection'
import { D3TreeDataDisplay } from './draw_tree_data'
import { D3DropTargetDisplay } from './draw_drop_targets'

const line_wrap_regex: RegExp = /[a-z0-9][A-Z]|[_\- ][a-zA-Z]/dg

function drawNewNodes(
  selection: d3.Selection<d3.EnterElement, d3.HierarchyNode<BTEditorNode>, SVGGElement, never>
) {
  const edit_node_store = useEditNodeStore()

  const group = selection
    .append<SVGGElement>('g')
    .classed(tree_node_css_class, true)
    .on('click.select', (event, node: d3.HierarchyNode<BTEditorNode>) => {
      if (event.shiftKey) {
        edit_node_store.selectMultipleNodes([node.data.node_id])
      } else {
        edit_node_store.editorSelectionChange(node.data.node_id)
      }
      event.stopPropagation()
    })

  group.append<SVGRectElement>('rect').classed(node_body_css_class, true)

  group.append<SVGTextElement>('text').classed(node_name_css_class, true)

  group.append<SVGTextElement>('text').classed(node_class_css_class, true)

  group
    .append('svg')
    .classed(node_state_css_class, true)
    .attr('width', icon_width)
    .attr('height', icon_width)
    .append('path')

  group.append<SVGGElement>('g').classed(node_inner_css_class, true)

  // The join pattern requires a return of the appended elements
  // For consistency the node body is filled using the update method
  return group
}

function resetNodeBody(
  selection: d3.Selection<SVGGElement, d3.HierarchyNode<BTEditorNode>, SVGGElement, unknown>
) {
  // Reset width and height of background rect
  selection
    .select<SVGRectElement>('.' + node_body_css_class)
    .attr('x', null)
    .attr('y', null)
    .attr('width', null)
    .attr('height', null)

  selection
    .select<SVGTextElement>('.' + node_name_css_class)
    .selectChildren<SVGTSpanElement, never>('tspan')
    .remove()

  selection
    .select<SVGTextElement>('.' + node_class_css_class)
    .selectChildren<SVGTSpanElement, never>('tspan')
    .remove()

  selection
    .select<SVGSVGElement>('.' + node_state_css_class)
    .attr('x', 0)
    .attr('y', 0)
}

function drawSubtrees(
  outer_tree_display: D3TreeDisplay,
  selection: d3.Selection<SVGGElement, d3.HierarchyNode<BTEditorNode>, SVGGElement, unknown>
) {
  const editor_store = useEditorStore()

  const old_subtree_nodes = new Set(outer_tree_display.nested_subtrees.keys())

  const new_subtree_nodes = new Set(editor_store.tree_structure_list.map((tree) => tree.tree_id))

  old_subtree_nodes.difference(new_subtree_nodes).forEach((key) => {
    outer_tree_display.nested_subtrees.get(key)!.clearTree()
    outer_tree_display.nested_subtrees.delete(key)
  })

  selection
    .filter((node) => new_subtree_nodes.difference(old_subtree_nodes).has(node.data.node_id))
    .each(function (node) {
      const nested_tree_display = new D3TreeDisplay(
        node.data.node_id,
        false,
        outer_tree_display.draw_indicator,
        d3.select(this).selectChild('.' + node_inner_css_class)!
      )
      outer_tree_display.nested_subtrees.set(node.data.node_id, nested_tree_display)
    })

  outer_tree_display.nested_subtrees.values().forEach((display) => display.drawTree())

  selection
    .filter((node) => new_subtree_nodes.has(node.data.node_id))
    .selectChild<SVGGElement>('.' + node_inner_css_class)
    .attr('transform', function () {
      const rect = this.getBBox()
      // Downscale and center subtree
      return `translate(${rect.width / 2 / 2 + node_padding},10) scale(0.5)`
    })
}

function layoutText(element: SVGGElement, data: d3.HierarchyNode<BTEditorNode>): number {
  // Track width of longest line and return that for box sizing
  let max_width: number = 0

  const group_elem = d3.select<SVGGElement, d3.HierarchyNode<BTEditorNode>>(element)

  const name_elem = group_elem.select<SVGTextElement>('.' + node_name_css_class)
  const class_elem = group_elem.select<SVGTextElement>('.' + node_class_css_class)

  const node_name = data.data.name
  const node_class = data.data.node_class

  let title_lines: number = 0

  // Find positions for potential line breaks
  let wrap_indices: number[] = [0]
  for (const match of node_name.matchAll(line_wrap_regex)) {
    wrap_indices.push(match.index + 1)
  }
  wrap_indices.push(node_name.length)
  wrap_indices.reverse()

  // Place text into multiple lines
  let current_index: number = 0
  while (current_index < node_name.length) {
    // Prepare DOM-element for next line
    const tspan = name_elem.append('tspan')
    tspan.attr('x', 0)
    if (current_index > 0) {
      tspan.attr('dy', node_name_height)
    }

    // Since this predicate is guaranteed to hold at some point, next_idx is always >= 0
    let next_idx: number = wrap_indices.findIndex((val) => {
      if (current_index === 0) {
        return val < name_line_length - name_first_line_indent
      } else {
        return val < current_index + name_line_length
      }
    })

    // If the next word is longer than the max line length, print it anyway
    if (wrap_indices[next_idx] === current_index) {
      next_idx -= 1
    }

    const next_index = wrap_indices[next_idx]
    tspan.text(node_name.slice(current_index, next_index))

    // Update variables for next line
    if (current_index === 0) {
      max_width = tspan.node()!.getComputedTextLength() + icon_width + node_padding
    } else {
      max_width = Math.max(max_width, tspan.node()!.getComputedTextLength())
    }
    current_index = next_index
    title_lines += 1
  }

  class_elem.attr('y', title_lines * node_name_height)

  // Find positions for potential line breaks
  wrap_indices = [0]
  for (const match of node_class.matchAll(line_wrap_regex)) {
    wrap_indices.push(match.index + 1)
  }
  wrap_indices.push(node_class.length)
  wrap_indices.reverse()

  // Place text into multiple lines
  current_index = 0
  while (current_index < node_class.length) {
    // Prepare DOM-element for next line
    const tspan = class_elem.append('tspan')
    tspan.attr('x', 0)
    if (current_index > 0) {
      tspan.attr('dy', node_class_height)
    }

    // Since this predicate is guaranteed to hold at some point, next_idx is always >= 0
    let next_idx: number = wrap_indices.findIndex((val) => val < current_index + class_line_length)

    // If the next word is longer than the max line length, print it anyway
    if (wrap_indices[next_idx] === current_index) {
      next_idx -= 1
    }

    const next_index = wrap_indices[next_idx]
    tspan.text(node_class.slice(current_index, next_index))

    // Update variables for next line
    max_width = Math.max(max_width, tspan.node()!.getComputedTextLength())
    current_index = next_index
  }

  return max_width
}

function updateNodeBody(
  selection: d3.Selection<SVGGElement, d3.HierarchyNode<BTEditorNode>, SVGGElement, never>
) {
  selection.each(function (node) {
    node.data.size.width = layoutText(this, node)
  })

  // Get width and height from text content
  selection.each(function (d) {
    const inputs = d.data.inputs || []
    const outputs = d.data.outputs || []
    const max_num_grippers = Math.max(inputs.length, outputs.length)
    const min_height =
      io_gripper_size * max_num_grippers + io_gripper_spacing * (max_num_grippers + 1)
    const rect = this.getBBox()
    d.data.offset.x = rect.x - node_padding
    d.data.offset.y = rect.y - 0.5 * node_padding
    // Width has already been set by text layout function
    d.data.size.width = Math.max(d.data.size.width, rect.width) + 2 * node_padding
    d.data.size.height = Math.max(rect.height + 1.5 * node_padding, min_height)
  })

  selection
    .select<SVGRectElement>('.' + node_body_css_class)
    .attr('x', (d) => d.data.offset.x)
    .attr('y', (d) => d.data.offset.y)
    .attr('width', (d) => d.data.size.width)
    .attr('height', (d) => d.data.size.height)
}

export class D3TreeDisplay {
  nested_subtrees: Map<UUIDString, D3TreeDisplay> = new Map()

  readonly tree_id: UUIDString
  readonly editable: boolean
  readonly draw_indicator: SVGPathElement
  readonly drop_target_display: D3DropTargetDisplay
  readonly data_display: D3TreeDataDisplay
  readonly root_element: d3.Selection<SVGGElement, unknown, null, undefined>
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
    this.root_element = root_element
    this.edges_element = root_element.append('g')
    this.vertices_element = root_element.append('g')

    this.drop_target_display = new D3DropTargetDisplay(this.tree_id, this.editable, root_element)

    const data_graph_element = root_element.append('g')
    this.data_display = new D3TreeDataDisplay(
      this.tree_id,
      this.editable,
      this.draw_indicator,
      data_graph_element
    )
  }

  private prepareTreeData(): d3.HierarchyNode<BTEditorNode> | undefined {
    const editor_store = useEditorStore()

    const tree_structure = findTree(editor_store.tree_structure_list, this.tree_id)

    if (tree_structure === undefined) {
      return undefined
    }

    // Strips potentially additional properties
    const onlyKeyAndType = (nodeData: NodeIO) =>
      ({
        key: nodeData.key,
        serialized_type: nodeData.serialized_type
      } as TrimmedNodeData)

    // Trim the serialized data values from the node data - we won't
    // render them, so don't clutter the DOM with the data
    const editor_nodes: BTEditorNode[] = tree_structure.nodes.map((node) => {
      return {
        node_id: rosToUuid(node.node_id),
        name: node.name,
        node_class: node.node_class,
        module: node.module,
        max_children: node.max_children,
        child_ids: node.child_ids.map(rosToUuid),
        options: node.options.map(onlyKeyAndType),
        inputs: node.inputs.map(onlyKeyAndType),
        outputs: node.outputs.map(onlyKeyAndType),
        size: { width: 1, height: 1 },
        offset: { x: 0, y: 0 }
      } as BTEditorNode
    })

    const forest_root: BTEditorNode = {
      node_id: uuid.NIL,
      name: '',
      node_class: '',
      module: '',
      max_children: -1,
      child_ids: [],
      inputs: [],
      outputs: [],
      options: [],
      size: { width: 0, height: 0 },
      offset: { x: 0, y: 0 }
    }

    if (editor_nodes.findIndex((x) => x.node_id === uuid.NIL) < 0) {
      editor_nodes.push(forest_root)
    }

    // Update the visual tree
    const parents: Record<UUIDString, UUIDString> = {}
    //const node_dict: Record<string, TrimmedNode> = {}; Is unused?
    // Find parents for all nodes once
    for (const i in editor_nodes) {
      const node = editor_nodes[i]
      //node_dict[node.name] = node;
      for (const j in node.child_ids) {
        parents[node.child_ids[j]] = node.node_id
      }
    }

    const root: d3.HierarchyNode<BTEditorNode> = d3
      .stratify<BTEditorNode>()
      .id((node) => {
        return node.node_id
      })
      .parentId((node) => {
        // undefined if it has no parent - does that break the layout?
        if (node.node_id in parents) {
          return parents[node.node_id]
        } else if (node.node_id === forest_root.node_id) {
          return undefined
        } else {
          forest_root.child_ids.push(node.node_id)
          return forest_root.node_id
        }
      })(editor_nodes)

    root.sort(function (a, b) {
      if (a.depth !== b.depth) {
        return b.depth - a.depth
      }
      while (a.parent !== b.parent) {
        a = a.parent!
        b = b.parent!
      }
      const child_list = a.parent!.data.child_ids
      return (
        child_list.findIndex((x) => x === a.data.node_id) -
        child_list.findIndex((x) => x === b.data.node_id)
      )
    })

    return root
  }

  private layoutTree(
    selection: d3.Selection<SVGGElement, d3.HierarchyNode<BTEditorNode>, SVGGElement, unknown>,
    tree: d3.HierarchyNode<BTEditorNode>
  ): FlextreeNode<BTEditorNode> {
    const editor_store = useEditorStore()

    // If the tree is in layer_mode, we have to get the max height for each layer
    const max_height_per_layer = Array<number>(tree.height + 1).fill(0.0)

    selection.each((node: d3.HierarchyNode<BTEditorNode>) => {
      max_height_per_layer[node.depth] = Math.max(
        node.data.size.height,
        max_height_per_layer[node.depth]
      )
    })

    const tree_layout = flextree<BTEditorNode>({
      nodeSize: (node: HierarchyNode<BTEditorNode>) => {
        let height: number
        if (editor_store.is_layer_mode) {
          height = max_height_per_layer[node.depth]
        } else {
          height = node.data.size.height
        }
        height += node.depth > 0 ? node_spacing : 0
        return [node.data.size.width, height]
      },
      spacing: (node: HierarchyNode<BTEditorNode>, oNode: HierarchyNode<BTEditorNode>) => {
        if (editor_store.is_layer_mode) {
          return node_spacing
        }
        if (node.parent !== oNode.parent) {
          return 2 * node_spacing
        } else {
          return node_spacing
        }
      } // This only applies to horizontal adjacent nodes
    })(tree as HierarchyNode<BTEditorNode>)
    //FIXME This typecast shouldn't be necessary, but apparrently the types
    // d3.HierarchyNode and d3-hierarchy.HierarchyNode differ, as
    // d3.HierarchyNode doesn't expose the find function???
    // Potentially an issue with the typing library

    // Bind the new data to get a selection with all flextree properties
    const new_selection = selection.data<FlextreeNode<BTEditorNode>>(
      tree_layout.descendants().filter((node) => node.data.node_id !== uuid.NIL),
      (node) => node.id!
    )
    let transition
    if (this.tree_transition === undefined) {
      transition = new_selection
    } else {
      transition = new_selection.transition(this.tree_transition)
    }
    transition.attr('transform', (d: FlextreeNode<BTEditorNode>) => {
      const x = d.x - d.data.size.width / 2.0
      const y = d.y
      return 'translate(' + x + ', ' + y + ')'
    })

    return tree_layout
  }

  private drawTreeNodes(tree: d3.HierarchyNode<BTEditorNode>): FlextreeNode<BTEditorNode> {
    const editor_store = useEditorStore()

    const node = this.vertices_element
      .selectChildren<SVGGElement, d3.HierarchyNode<BTEditorNode>>('.' + tree_node_css_class)
      .data(
        tree.descendants().filter((node) => node.data.node_id !== uuid.NIL),
        (node) => node.id!
      ) // Join performs enter, update and exit at once
      .join(drawNewNodes)
      .call(resetNodeBody)
      .call((selection) => drawSubtrees(this, selection))
      .call(updateNodeBody)

    // No tree modifying if displaying a subtree
    if (this.editable) {
      node.on('mousedown.dragdrop', (event, node: d3.HierarchyNode<BTEditorNode>) => {
        editor_store.startDraggingExistingNode(node)
        event.stopPropagation()
      })
    }

    // Since we want to return the tree, we can't use the .call() syntax here
    const tree_layout = this.layoutTree(node, tree)

    node
      .filter((node) => node.data.name === 'Subtree')
      .each(function (node) {
        console.log(this)
        console.log(this.getBBox())
        console.log(node.data.size)
      })

    return tree_layout
  }

  private drawTreeEdges(tree_layout: FlextreeNode<BTEditorNode>) {
    const edge_selection = this.edges_element
      .selectChildren<SVGPathElement, d3.HierarchyLink<BTEditorNode>>('.' + tree_edge_css_class)
      .data(
        tree_layout
          .links()
          .filter((link: d3.HierarchyLink<BTEditorNode>) => link.source.data.node_id !== uuid.NIL),
        (link) => link.source.id! + '###' + link.target.id!
      )
      .join('path')
      .classed(tree_edge_css_class, true) // Redundant for update elements, preserves readability
    let edge_transition
    if (this.tree_transition === undefined) {
      edge_transition = edge_selection
    } else {
      edge_transition = edge_selection.transition(this.tree_transition)
    }
    edge_transition.attr(
      'd',
      d3
        .linkVertical<SVGPathElement, HierarchyLink<BTEditorNode>, [number, number]>()
        .source((link: HierarchyLink<BTEditorNode>) => {
          const source = link.source as FlextreeNode<BTEditorNode>
          return [
            source.x + source.data.offset.x,
            source.y + source.data.offset.y + source.data.size.height
          ]
        })
        .target((link: HierarchyLink<BTEditorNode>) => {
          const target = link.target as FlextreeNode<BTEditorNode>
          return [target.x + target.data.offset.x, target.y + target.data.offset.y]
        })
    )
  }

  public drawTree() {
    const tree = this.prepareTreeData()

    if (tree === undefined) {
      return
    }

    const tree_layout = this.drawTreeNodes(tree)

    this.drawTreeEdges(tree_layout)

    this.data_display.drawTreeData(tree_layout)

    this.drop_target_display.drawDropTargets(tree_layout)
  }

  public updateTransition(tree_transition: d3.Transition<d3.BaseType, unknown, null, undefined>) {
    this.tree_transition = tree_transition
    this.data_display.tree_transition = tree_transition
    // Transitions aren't passed to nested trees, since they cause timing issues
  }

  public clearTree() {
    this.root_element.selectChildren().remove()
  }

  public toggleExistingNodeDropTargets(dragged_node: d3.HierarchyNode<BTEditorNode>) {
    const editor_store = useEditorStore()

    const target_tree = findTreeContainingNode(
      editor_store.tree_structure_list,
      getNodeStructures,
      dragged_node.data.node_id
    )

    if (target_tree === undefined) {
      console.warn("Can't find tree of dragged node")
      return
    }

    if (this.tree_id === target_tree.tree_id) {
      this.drop_target_display.toggleExistingNodeTargets(dragged_node)
    } else {
      this.nested_subtrees
        .values()
        .forEach((value) => value.toggleExistingNodeDropTargets(dragged_node))
    }
  }

  public toggleNewNodeDropTargets(dragged_node: DocumentedNode) {
    this.drop_target_display.toggleNewNodeTargets(dragged_node)
    this.nested_subtrees.values().forEach((value) => value.toggleNewNodeDropTargets(dragged_node))
  }

  public highlightCompatibleDataVertices(other_endpoint: DataEdgeTerminal) {
    const editor_store = useEditorStore()

    const target_tree = findTreeContainingNode(
      editor_store.tree_structure_list,
      getNodeStructures,
      other_endpoint.node.data.node_id
    )

    if (target_tree === undefined) {
      console.warn("Can't find tree of dragged node")
      return
    }

    if (this.tree_id === target_tree.tree_id) {
      this.data_display.highlightCompatibleVertices(other_endpoint)
    } else {
      this.nested_subtrees
        .values()
        .forEach((value) => value.highlightCompatibleDataVertices(other_endpoint))
    }
  }
}
