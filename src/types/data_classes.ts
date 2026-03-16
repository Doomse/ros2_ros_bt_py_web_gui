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

import { DataTypeValues, type NodeDataType } from './data_types'

export abstract class DataType<ValueType = any> {
  allow_dynamic: boolean
  allow_static: boolean
  is_static: boolean

  constructor(type_msg: NodeDataType) {
    this.allow_dynamic = type_msg.allow_dynamic
    this.allow_static = type_msg.allow_static
    this.is_static = type_msg.is_static
  }

  toTypeMsg(): NodeDataType {
    return {
      allow_dynamic: this.allow_dynamic,
      allow_static: this.allow_static,
      is_static: this.is_static
    } as NodeDataType
  }

  abstract isCompatible(other: DataType): boolean

  abstract prettyprint(): string

  abstract serializeValue(value: ValueType): string

  abstract parseValue(ser_value: string): ValueType
}

abstract class BuiltinDataType<ValueType> extends DataType<ValueType> {
  serializeValue(value: ValueType): string {
    return JSON.stringify(value)
  }

  parseValue(ser_value: string): ValueType {
    return JSON.parse(ser_value)
  }
}

export class BoolType extends BuiltinDataType<boolean> {
  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.BOOL_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for bool`)
    }
    super(type_msg)
  }

  toTypeMsg(): NodeDataType {
    const type_msg = super.toTypeMsg()
    type_msg.type_identifier = DataTypeValues.BOOL_TYPE
    return type_msg
  }

  isCompatible(other: DataType): boolean {
    return other instanceof BoolType
  }

  prettyprint(): string {
    return 'bool'
  }
}

export class IntType extends BuiltinDataType<number> {
  min_value: number
  max_value: number

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.INT_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for int`)
    }
    super(type_msg)
    this.min_value = type_msg.int_min_value
    this.max_value = type_msg.int_max_value
  }

  toTypeMsg(): NodeDataType {
    const type_msg = super.toTypeMsg()
    type_msg.type_identifier = DataTypeValues.INT_TYPE
    type_msg.int_min_value = this.min_value
    type_msg.int_max_value = this.max_value
    return type_msg
  }

  isCompatible(other: DataType): boolean {
    if (!(other instanceof IntType)) {
      return false
    }
    if (this.min_value > other.min_value) {
      return false
    }
    if (this.max_value < other.max_value) {
      return false
    }
    return true
  }

  prettyprint(): string {
    switch ([this.min_value, this.max_value]) {
      case [-(2 ** 63), 2 ** 63 - 1]:
        return 'int64'
      case [-(2 ** 31), 2 ** 31 - 1]:
        return 'int32'
      case [-(2 ** 15), 2 ** 15 - 1]:
        return 'int16'
      case [-(2 ** 7), 2 ** 7 - 1]:
        return 'int8'
      case [0, 2 ** 64 - 1]:
        return 'int64'
      case [0, 2 ** 32 - 1]:
        return 'int32'
      case [0, 2 ** 16 - 1]:
        return 'int16'
      case [0, 2 ** 8 - 1]:
        return 'int8'
      default:
        return `int(min=${this.min_value}, max=${this.max_value})`
    }
  }
}

export class FloatType extends BuiltinDataType<number> {
  min_value: number
  max_value: number

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.FLOAT_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for float`)
    }
    super(type_msg)
    this.min_value = type_msg.float_min_value
    this.max_value = type_msg.float_max_value
  }

  toTypeMsg(): NodeDataType {
    const type_msg = super.toTypeMsg()
    type_msg.type_identifier = DataTypeValues.FLOAT_TYPE
    type_msg.int_min_value = this.min_value
    type_msg.int_max_value = this.max_value
    return type_msg
  }

  isCompatible(other: DataType): boolean {
    if (!(other instanceof FloatType)) {
      return false
    }
    if (this.min_value > other.min_value) {
      return false
    }
    if (this.max_value < other.max_value) {
      return false
    }
    return true
  }

  prettyprint(): string {
    switch ([this.min_value, this.max_value]) {
      case [-1.7976931348623157e308, 1.7976931348623157e308]:
        return 'float64'
      case [-3.4028235e38, 3.4028235e38]:
        return 'float32'
      default:
        return `float(min=${this.min_value}, max=${this.max_value})`
    }
  }
}

export class StringType extends BuiltinDataType<string> {
  max_length: number
  strict_length: boolean
  valid_values: string[]

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.STRING_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for string`)
    }
    super(type_msg)
    this.max_length = type_msg.string_max_length
    this.strict_length = type_msg.string_strict_length
    this.valid_values = type_msg.serialized_value_options
  }

  toTypeMsg(): NodeDataType {
    const type_msg = super.toTypeMsg()
    type_msg.type_identifier = DataTypeValues.STRING_TYPE
    type_msg.string_max_length = this.max_length
    type_msg.string_strict_length = this.strict_length
    type_msg.serialized_value_options = this.valid_values
    return type_msg
  }

  isCompatible(other: DataType): boolean {
    if (!(other instanceof StringType)) {
      return false
    }
    if (this.max_length < other.max_length) {
      return false
    }
    if (this.strict_length && !other.strict_length) {
      return false
    }
    if (this.valid_values.length > 0) {
      for (const val of other.valid_values) {
        if (!this.valid_values.includes(val)) {
          return false
        }
      }
    }
    return true
  }

  prettyprint(): string {
    if (this.max_length === 2 ** 64 - 1) {
      return 'string'
    }
    return `string${this.strict_length ? '=' : '<'}=${this.max_length}`
  }
}

export class PathType extends BuiltinDataType<string> {
  max_length: number
  strict_length: boolean
  valid_values: string[]

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.PATH_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for path`)
    }
    super(type_msg)
    this.max_length = type_msg.string_max_length
    this.strict_length = type_msg.string_strict_length
    this.valid_values = type_msg.serialized_value_options
  }

  toTypeMsg(): NodeDataType {
    const type_msg = super.toTypeMsg()
    type_msg.string_max_length = this.max_length
    type_msg.string_strict_length = this.strict_length
    type_msg.serialized_value_options = this.valid_values
    return type_msg
  }

  isCompatible(other: DataType): boolean {
    if (!(other instanceof PathType)) {
      return false
    }
    if (this.max_length < other.max_length) {
      return false
    }
    if (this.strict_length && !other.strict_length) {
      return false
    }
    if (this.valid_values.length > 0) {
      for (const val of other.valid_values) {
        if (!this.valid_values.includes(val)) {
          return false
        }
      }
    }
    return true
  }

  prettyprint(): string {
    if (this.max_length === 2 ** 64 - 1) {
      return 'path'
    }
    return `path${this.strict_length ? '=' : '<'}=${this.max_length}`
  }
}

export class BytesType extends BuiltinDataType<string> {
  max_length: number
  strict_length: boolean
  valid_values: string[]

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.BYTES_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for bytes`)
    }
    super(type_msg)
    this.max_length = type_msg.string_max_length
    this.strict_length = type_msg.string_strict_length
    this.valid_values = type_msg.serialized_value_options
  }

  toTypeMsg(): NodeDataType {
    const type_msg = super.toTypeMsg()
    type_msg.string_max_length = this.max_length
    type_msg.string_strict_length = this.strict_length
    type_msg.serialized_value_options = this.valid_values
    return type_msg
  }

  isCompatible(other: DataType): boolean {
    if (!(other instanceof BytesType)) {
      return false
    }
    if (this.max_length < other.max_length) {
      return false
    }
    if (this.strict_length && !other.strict_length) {
      return false
    }
    if (this.valid_values.length > 0) {
      for (const val of other.valid_values) {
        if (!this.valid_values.includes(val)) {
          return false
        }
      }
    }
    return true
  }

  prettyprint(): string {
    if (this.max_length === 1 && this.strict_length) {
      return 'byte'
    }
    if (this.max_length === 2 ** 64 - 1) {
      return 'bytes'
    }
    return `bytes${this.strict_length ? '=' : '<'}=${this.max_length}`
  }
}

export class ListType extends BuiltinDataType<any[]> {
  max_length: number
  strict_length: boolean
  element_type?: DataType

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.LIST_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for list`)
    }
    super(type_msg)
    this.max_length = type_msg.iterable_max_length[0]
    this.strict_length = type_msg.iterable_strict_length[0]
    // TODO Decode value type
  }

  toTypeMsg(): NodeDataType {
    let type_msg: NodeDataType
    if (this.element_type === undefined) {
      type_msg = super.toTypeMsg()
      type_msg.value_type_identifier = [DataTypeValues.UNDEFINED_TYPE]
      type_msg.iterable_max_length = []
      type_msg.iterable_strict_length = []
    } else {
      type_msg = this.element_type.toTypeMsg()
      type_msg.value_type_identifier = [type_msg.type_identifier].concat(
        type_msg.value_type_identifier
      )
    }
    type_msg.type_identifier = DataTypeValues.LIST_TYPE
    type_msg.iterable_max_length = [this.max_length].concat(type_msg.iterable_max_length)
    type_msg.iterable_strict_length = [this.strict_length].concat(type_msg.iterable_strict_length)
    return type_msg
  }

  isCompatible(other: DataType): boolean {
    if (!(other instanceof ListType)) {
      return false
    }
    if (this.max_length < other.max_length) {
      return false
    }
    if (this.strict_length && !other.strict_length) {
      return false
    }
    if (this.element_type !== undefined) {
      if (other.element_type === undefined) {
        return false
      }
      if (!this.element_type.isCompatible(other.element_type)) {
        return false
      }
    }
    return true
  }

  prettyprint(): string {
    let prt_str = 'list'
    if (this.element_type !== undefined) {
      prt_str += `[${this.element_type.prettyprint()}]`
    }
    if (this.max_length !== 2 ** 64 - 1) {
      prt_str += `${this.strict_length ? '=' : '<'}=${this.max_length}`
    }
    return prt_str
  }

  serializeValue(value: any[]): string {
    if (this.element_type === undefined) {
      return super.serializeValue(value)
    }
    const ser_list: any[] = []
    value.forEach((v) => ser_list.push(this.element_type!.serializeValue(v)))
    return super.serializeValue(ser_list)
  }

  parseValue(ser_value: string): any[] {
    if (this.element_type === undefined) {
      return super.parseValue(ser_value)
    }
    const value_list = JSON.parse(ser_value) as any[]
    const value: any[] = []
    value_list.forEach((v) => value.push(this.element_type!.parseValue(JSON.stringify(v))))
    return value
  }
}

export class DictType extends BuiltinDataType<Map<string, any>> {
  max_length: number
  strict_length: boolean
  element_type?: DataType

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.DICT_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for dict`)
    }
    super(type_msg)
    this.max_length = type_msg.iterable_max_length[0]
    this.strict_length = type_msg.iterable_strict_length[0]
    // TODO Decode value type
  }

  toTypeMsg(): NodeDataType {
    let type_msg: NodeDataType
    if (this.element_type === undefined) {
      type_msg = super.toTypeMsg()
      type_msg.value_type_identifier = [DataTypeValues.UNDEFINED_TYPE]
      type_msg.iterable_max_length = []
      type_msg.iterable_strict_length = []
    } else {
      type_msg = this.element_type.toTypeMsg()
      type_msg.value_type_identifier = [type_msg.type_identifier].concat(
        type_msg.value_type_identifier
      )
    }
    type_msg.type_identifier = DataTypeValues.DICT_TYPE
    type_msg.iterable_max_length = [this.max_length].concat(type_msg.iterable_max_length)
    type_msg.iterable_strict_length = [this.strict_length].concat(type_msg.iterable_strict_length)
    return type_msg
  }

  isCompatible(other: DataType): boolean {
    if (!(other instanceof ListType)) {
      return false
    }
    if (this.max_length < other.max_length) {
      return false
    }
    if (this.strict_length && !other.strict_length) {
      return false
    }
    if (this.element_type !== undefined) {
      if (other.element_type === undefined) {
        return false
      }
      if (!this.element_type.isCompatible(other.element_type)) {
        return false
      }
    }
    return true
  }

  prettyprint(): string {
    let prt_str = 'dict'
    if (this.element_type !== undefined) {
      prt_str += `[${this.element_type.prettyprint()}]`
    }
    if (this.max_length !== 2 ** 64 - 1) {
      prt_str += `${this.strict_length ? '=' : '<'}=${this.max_length}`
    }
    return prt_str
  }

  serializeValue(value: Map<string, any>): string {
    if (this.element_type === undefined) {
      return super.serializeValue(value)
    }
    const ser_dict = new Map<string, string>()
    value.forEach((v, k) => ser_dict.set(k, this.element_type!.serializeValue(v)))
    return super.serializeValue(ser_dict)
  }

  parseValue(ser_value: string): Map<string, any> {
    if (this.element_type === undefined) {
      return super.parseValue(ser_value)
    }
    const value_dict = JSON.parse(ser_value) as any[]
    const value = new Map<string, any>()
    Object.entries(value_dict).forEach(([k, v]) =>
      value.set(k, this.element_type!.parseValue(JSON.stringify(v)))
    )
    return value
  }
}

export class BuiltinType extends DataType<string> {
  valid_types: string[]

  constructor(type_msg: NodeDataType) {
    if (type_msg.type_identifier !== DataTypeValues.BUILTIN_TYPE) {
      throw Error(`Type msg ${type_msg} has incorrect identifier for builtin`)
    }
    super(type_msg)
    this.valid_types = type_msg.serialized_value_options
  }

  toTypeMsg(): NodeDataType {
    const type_msg = super.toTypeMsg()
    type_msg.type_identifier = DataTypeValues.BUILTIN_TYPE
    type_msg.serialized_value_options = this.valid_types
    return type_msg
  }

  isCompatible(other: DataType): boolean {
    if (!(other instanceof BuiltinType)) {
      return false
    }
    if (this.valid_types.length > 0) {
      for (const val of other.valid_types) {
        if (!this.valid_types.includes(val)) {
          return false
        }
      }
    }
    return true
  }

  prettyprint(): string {
    return 'type'
  }

  serializeValue(value: string): string {
    return value
  }

  parseValue(ser_value: string): string {
    return ser_value
  }
}
