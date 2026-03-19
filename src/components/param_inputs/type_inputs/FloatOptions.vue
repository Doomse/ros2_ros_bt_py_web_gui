<!--
 *  Copyright 2026 FZI Forschungszentrum Informatik
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
import { FLOAT_LIMITS } from '@/types/data_types'
import { ref, watch } from 'vue'

const min_value = defineModel<string>('min_value')
const max_value = defineModel<string>('max_value')

const float_choice_order = ['float32', 'float64', 'custom']

let init_min_max_option = 'custom'
for (const [key, [min, max]] of Object.entries(FLOAT_LIMITS)) {
  if (min.toString() === min_value.value && max.toString() === max_value.value) {
    init_min_max_option = key
  }
}

const min_max_option = ref<string>(init_min_max_option)
watch(min_max_option, (val) => {
  if (Object.keys(FLOAT_LIMITS).includes(val)) {
    min_value.value = FLOAT_LIMITS[val][0].toString()
    max_value.value = FLOAT_LIMITS[val][1].toString()
  }
})
</script>

<template>
  <div class="row mx-0 mb-1">
    <div v-for="opt in float_choice_order" class="col-6" :key="opt">
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
        v-model="min_value"
        type="number"
        class="form-control"
        :disabled="min_max_option !== 'custom'"
      />
      <span class="input-group-text">Max:</span>
      <input
        v-model="max_value"
        type="number"
        class="form-control"
        :disabled="min_max_option !== 'custom'"
      />
    </div>
  </div>
</template>
