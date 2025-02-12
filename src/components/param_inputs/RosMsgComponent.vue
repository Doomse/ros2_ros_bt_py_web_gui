<!--
 *  Copyright 2025 FZI Forschungszentrum Informatik
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
import { computed, ref } from 'vue';


const props = defineProps<{
  field_dict: Record<string, never>,
  field_types: Record<string, any>,
  field_key: string[]
  render_content: boolean
}>()

type FieldType = 'plain' | 'sequence' | 'nested'

const plain_fields = computed<Record<string, any>[]>(
  () => getFields('plain')
)

const nested_fields = computed<Record<string, any>[]>(
  () => getFields('nested')
)

const sequence_fields = computed<Record<string, any>[]>(
  () => getFields('sequence')
)

const render_children = ref<Record<string, boolean>>({})
nested_fields.value.forEach(element => {
  render_children.value[element.name] = props.render_content
});
sequence_fields.value.forEach(element => {
  render_children.value[element.name] = props.render_content
});

function getFields(type: FieldType): Record<string, any>[]{
  const fields: Record<string, any>[] = []
  Object.keys(props.field_types).forEach(key => {
    if (determineFieldType(key) === type) {
      const field = props.field_types[key]
      field.name = key
      fields.push(field)
    }
  })
  return fields
}

function determineFieldType(key: string): FieldType {
  if (props.field_types[key].nested_type === null) {
    return 'plain'
  }
  if (props.field_types[key].own_type.startsWith('sequence')) {
    return 'sequence'
  }
  return 'nested'
}

function invertRenderChild(key: string) {
  render_children.value[key] = 
    !render_children.value[key]
}

</script>

<template>
  <template v-if="props.render_content">
    <div v-if="plain_fields" class="d-table py-1 w-100">
      <div 
        v-for="field in plain_fields"
        :key="field.name"
        class="input-group d-table-row"
      >
        <span class="input-group-text d-table-cell">
          {{ field.name }}
        </span>
        <input 
          type="text" 
          class="form-control d-table-cell w-100" 
          :value="field.default_value"
        >
        <span class="input-group-text text-muted d-table-cell">
          {{ field.own_type }}
        </span>
      </div>
    </div>
    <div v-if="nested_fields" class="list-group">
      <div
        v-for="field in nested_fields"
        :key="field.name"
        class="list-group-item"
      >
        <div @click="invertRenderChild(field.name)" class="d-flex w-100 cursor-pointer">
          {{ field.name }}
          <span class="text-muted">{{ field.own_type }}</span>
          <font-awesome-icon
            :icon="'fa-solid ' + (render_children[field.name] ? 'fa-angle-up' : 'fa-angle-down')"
            class="ms-auto"
            aria-hidden="true"
          />
        </div>
        <RosMsgComponent 
          :field_dict="props.field_dict"
          :field_types="field.nested_type"
          :field_key="props.field_key.concat(field.name)"
          :render_content="render_children[field.name]"
        />
      </div>
    </div>
    <div v-if="sequence_fields" class="list-group">
      <div 
        v-for="field in sequence_fields"
        :key="field.name"
        class="list-group-item"
      >
        <div @click="invertRenderChild(field.name)">
          {{ field.name }}
          <span class="text-muted">{{ field.own_type }}</span>
          <font-awesome-icon
            :icon="'fa-solid ' + (render_children[field.name] ? 'fa-angle-up' : 'fa-angle-down')"
            class="ms-auto"
            aria-hidden="true"
          />
        </div>
        <div v-if="render_children[field.name]">
          Sequence Handling
        </div>
      </div>
    </div>
  </template>
</template>

<style lang="scss" scoped>

.d-table .input-group:nth-last-child(n+2) * {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.d-table .input-group:nth-child(n+2) * {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.d-table .input-group *:last-child {
  border-left: 0;
}

</style>