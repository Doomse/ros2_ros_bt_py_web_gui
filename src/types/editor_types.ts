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

import type { FlextreeNode } from 'd3-flextree'
import type { Wiring } from './data_types'
import type { UUIDString, NodeStateValues } from './types'
import type { DataType } from './data_classes'

export const enum IOKind {
  INPUT,
  OUTPUT
}

export type DataEdgePoint = {
  x: number
  y: number
}

export type IdentifiedDataEdgePoint = DataEdgePoint & {
  tree_id: UUIDString
  node_id: UUIDString
  key: string
  kind: IOKind
}

export type DataEdgeTerminal = DataEdgePoint & {
  node: FlextreeNode<BTEditorNode>
  index: number
  key: string
  type: DataType
  kind: IOKind
}

export type IdentifiedDataEdge = {
  p1: IdentifiedDataEdgePoint
  p2: IdentifiedDataEdgePoint
  key: string
}

export type DataEdge = {
  source: DataEdgeTerminal
  target: DataEdgeTerminal
  wiring: Wiring
}

export type DropTarget = {
  node: FlextreeNode<BTEditorNode>
  position: Position
}

export const enum Position {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
  CENTER = 'center',
  ROOT = 'root'
}

export type NodeData = {
  key: string
  type: DataType
  serialized_value: string
}

export type BTEditorNode = {
  node_id: UUIDString
  name: string

  node_class: string
  module: string

  max_children: number
  child_ids: UUIDString[]

  inputs: NodeData[]
  outputs: NodeData[]

  // Reference to contained tree, if at all
  tree_ref: UUIDString | ''

  // Reference to own tree for global identification
  tree_id: UUIDString

  size: { width: number; height: number }
  offset: { x: number; y: number }

  state?: NodeStateValues
}
