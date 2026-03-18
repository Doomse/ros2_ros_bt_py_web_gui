<!--
 *  Copyright 2024-2026 FZI Forschungszentrum Informatik
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *
 *     * Neither the name of the {copyright_holder} nor the names of its
 *       contributors may be used to endorse or promote products derived from
 *       this software without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 *  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 *  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 *  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 *  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 *  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 *  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 *  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 -->
<script setup lang="ts">
import type { BuiltinType } from '@/types/data_classes'
import SearchableInput from '../SearchableInput.vue'
import Fuse from 'fuse.js'
import { computed, ref, watch } from 'vue'
import { DataTypeValues, FLOAT_LIMITS, IDENTIFIER_KEY, INT_LIMITS } from '@/types/data_types'

const props = defineProps<{
  type: BuiltinType
}>()

const value = defineModel<Record<string, any>>()

const type_list = computed<string[]>(() => props.type.valid_types.map((x) => x.type))

let init_chosen_type = ''
const initial_type = props.type.valid_types.find(
  (x) => x.value[IDENTIFIER_KEY] === value.value![IDENTIFIER_KEY]
)
if (initial_type !== undefined) {
  init_chosen_type = initial_type.type
}

const chosen_type = ref<string>(init_chosen_type)
watch(chosen_type, (val: string) => {
  const type_value = props.type.valid_types.find((x) => x.type === val)
  if (type_value === undefined) {
    return
  }
  value.value = type_value.value
})

// Below is handling for numeric types

const int_choice_order = [
  'int8',
  'uint8',
  'int16',
  'uint16',
  'int32',
  'uint32',
  'int64',
  'uint64',
  'custom'
]

const float_choice_order = ['float32', 'float64', 'custom']

const number_choices = computed<string[]>(() => {
  if (value.value === undefined) {
    return []
  }
  if (value.value[IDENTIFIER_KEY] === DataTypeValues.INT_TYPE) {
    return int_choice_order
  }
  if (value.value[IDENTIFIER_KEY] === DataTypeValues.FLOAT_TYPE) {
    return float_choice_order
  }
  return []
})

let init_min_max_option = ''
for (const [key, [min, max]] of Object.entries(INT_LIMITS)) {
  if (min.toString() === value.value!.min_value && max.toString() === value.value!.max_value) {
    init_min_max_option = key
  }
}
for (const [key, [min, max]] of Object.entries(FLOAT_LIMITS)) {
  if (min.toString() === value.value!.min_value && max.toString() === value.value!.max_value) {
    init_min_max_option = key
  }
}

const min_max_option = ref<string>(init_min_max_option || 'custom')
watch(min_max_option, (val) => {
  if (Object.keys(INT_LIMITS).includes(val)) {
    updateMinValue(INT_LIMITS[val][0])
    updateMaxValue(INT_LIMITS[val][1])
  }
  if (Object.keys(FLOAT_LIMITS).includes(val)) {
    updateMinValue(FLOAT_LIMITS[val][0])
    updateMaxValue(FLOAT_LIMITS[val][1])
  }
})

function updateMinValue(min: number | bigint | string) {
  if (value.value === undefined) {
    return
  }
  value.value.min_value = min.toString()
}

function updateMaxValue(max: number | bigint | string) {
  if (value.value === undefined) {
    return
  }
  value.value.max_value = max.toString()
}

function getInputValue(event: Event): string {
  return (event.target as HTMLInputElement).value
}

// Below is handling for string and iterable types
</script>

<template>
  <SearchableInput
    v-model="chosen_type"
    :item_list="type_list"
    :search_fuse="new Fuse(type_list)"
    :parse="(x: string) => x"
    :search_target="(x: string) => x"
    :render_function="(x: string) => x"
  />
  <template v-if="value !== undefined">
    <div v-if="number_choices.length > 0" class="row mx-0 mb-1">
      <div v-for="opt in number_choices" class="col-6" :key="opt">
        <div class="form-check">
          <input
            type="radio"
            class="form-check-input"
            :checked="opt === min_max_option"
            @change="min_max_option = opt"
          />
          <label>{{ opt }}</label>
        </div>
      </div>
      <div class="input-group input-group-sm">
        <span class="input-group-text">Min:</span>
        <input
          type="number"
          class="form-control"
          :disabled="min_max_option !== 'custom'"
          :value="Number(value.min_value) || 0"
          @change="(ev) => updateMinValue(getInputValue(ev))"
        />
        <span class="input-group-text">Max:</span>
        <input
          type="number"
          class="form-control"
          :disabled="min_max_option !== 'custom'"
          :value="Number(value.max_value) || 0"
          @change="(ev) => updateMaxValue(getInputValue(ev))"
        />
      </div>
    </div>
  </template>
</template>
