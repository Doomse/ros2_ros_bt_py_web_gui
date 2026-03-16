/*
 * Copyright 2024-2026 FZI Forschungszentrum Informatik
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
import * as uuid from 'uuid'
import type { UUIDMsg, UUIDString, RosTime } from './types/types'
import { findNodeInTreeList, getNodeStructures } from './tree_selection'
import { useEditorStore } from './stores/editor'
import { DataTypeValues, type NodeDataType, type Wiring } from './types/data_types'
import type { DataEdgeTerminal } from './types/editor_types'
import {
  BoolType,
  BytesType,
  DictType,
  FloatType,
  IntType,
  ListType,
  PathType,
  StringType,
  type DataType
} from './types/data_classes'

export function parseRosTime(time: RosTime): Date {
  return new Date(time.sec * 1000 + time.nanosec / 1000000)
}

export function getTypeFromMsg(type_msg: NodeDataType): DataType {
  switch (type_msg.type_identifier) {
    case DataTypeValues.BOOL_TYPE:
      return new BoolType(type_msg)
    case DataTypeValues.INT_TYPE:
      return new IntType(type_msg)
    case DataTypeValues.FLOAT_TYPE:
      return new FloatType(type_msg)
    case DataTypeValues.STRING_TYPE:
      return new StringType(type_msg)
    case DataTypeValues.PATH_TYPE:
      return new PathType(type_msg)
    case DataTypeValues.BYTES_TYPE:
      return new BytesType(type_msg)
    case DataTypeValues.LIST_TYPE:
      return new ListType(type_msg)
    case DataTypeValues.DICT_TYPE:
      return new DictType(type_msg)
    default:
      throw Error(`Unrecognized data type ${type_msg}`)
  }
}

export function rosToUuid(msg: UUIDMsg): UUIDString {
  if (!uuid.validate(msg)) {
    throw TypeError(`Message ${msg} is not a valid uuid`)
  }
  return msg
}

export function uuidToRos(str: UUIDString): UUIDMsg {
  if (!uuid.validate(str)) {
    throw TypeError(`String ${str} is not a valid uuid`)
  }
  return str
}

export function compareRosUuid(u1: UUIDMsg, u2: UUIDMsg): boolean {
  return rosToUuid(u1) === rosToUuid(u2)
}

export function replaceNameIdParts(tree_id: UUIDString, name_id_parts: string): string {
  const editor_store = useEditorStore()
  return name_id_parts
    .split('.')
    .map((name_id) => {
      // If this is the id of a node, replace it with its name
      const node = findNodeInTreeList(
        editor_store.tree_structure_list,
        getNodeStructures,
        tree_id,
        name_id
      )
      if (node === undefined) {
        return name_id
      }
      return node.name
    })
    .join('.')
}

export function compareWirings(w1: Wiring, w2: Wiring): boolean {
  return (
    compareRosUuid(w1.source.node_id, w2.source.node_id) &&
    w1.source.data_key === w2.source.data_key &&
    compareRosUuid(w1.target.node_id, w2.target.node_id) &&
    w1.target.data_key === w2.target.data_key
  )
}

export function typesCompatible(source: DataEdgeTerminal, target: DataEdgeTerminal) {
  if (source.node.data.node_id === target.node.data.node_id) {
    return false
  }

  return source.type.isCompatible(target.type)
}

export function getShortDoc(doc: string) {
  if (!doc || doc == null || doc.length == 0) {
    return 'No documentation provided'
  } else {
    const index = doc.indexOf('**Behavior Tree I/O keys**')
    if (index < 0) {
      return doc
    } else {
      return doc.substring(0, index).trim()
    }
  }
}

export enum NameConflictHandler {
  ASK = 'Ask before overwrite',
  OVERWRITE = 'Overwrite file',
  RENAME = 'Rename file'
}

export function parseConflictHandler(handler: NameConflictHandler): [boolean, boolean] {
  let allow_overwrite: boolean
  let allow_rename: boolean
  switch (handler) {
    case NameConflictHandler.ASK:
      allow_overwrite = false
      allow_rename = false
      break
    case NameConflictHandler.OVERWRITE:
      allow_overwrite = true
      allow_rename = false
      break
    case NameConflictHandler.RENAME:
      allow_overwrite = false
      allow_rename = true
      break
    default:
      console.warn('Improper state for name conflict resolution strategy', handler)
      allow_overwrite = false
      allow_rename = false
      break
  }
  return [allow_overwrite, allow_rename]
}

const treatable_error_prefixes: string[] = [
  'Expected data to be of type type, got dict instead. Looks like failed jsonpickle decode,',
  'AttributeError, maybe a ROS Message definition changed.'
]

export function isLoadErrorTreatable(error: string) {
  let treatable = false
  treatable_error_prefixes.forEach((val) => {
    if (error.startsWith(val)) {
      treatable = true
    }
  })
  return treatable
}
