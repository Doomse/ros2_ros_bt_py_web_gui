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

const props = defineProps<{
    field_dict: Record<string, never>,
    field_types: Record<string, never>,
    field_key: string[]
}>()

</script>

<template>
  <div 
    v-if="field_types['nested_type'] === null"
    class="input-group mt-2"
  >
    <span class="input-group-text">
      {{ props.field_key[props.field_key.length - 1] }}
    </span>
    <input 
      type="text" 
      class="form-control" 
      :value="field_types['default_value']"
    >
    <span class="input-group-text text-muted">
      {{ field_types['own_type'] }}
    </span>
  </div>
  <div v-else class="list-group-item">
    <div>
      {{ props.field_key[props.field_key.length - 1] }}
      <span class="text-muted">{{ props.field_types['own_type'] }}</span>
    </div>
    <div v-if="(field_types['own_type'] as string).startsWith('sequence')">
        Sequence Handling
    </div>
    <div v-else class="list-group">
      <RosMsgComponent 
        v-for="key in Object.keys(field_types['nested_type'])"
        :key="key"
        :field_dict="props.field_dict"
        :field_types="field_types['nested_type'][key]"
        :field_key="props.field_key.concat(key)"
      />
    </div>
  </div>
</template>