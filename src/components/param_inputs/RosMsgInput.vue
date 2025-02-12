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
import { useEditNodeStore } from '@/stores/edit_node';
import { useEditorStore } from '@/stores/editor';
import { useROSStore } from '@/stores/ros';
import { RosTopicType_Name, type RosType } from '@/types/python_types';
import type { GetMessageFieldsRequest, GetMessageFieldsResponse } from '@/types/services/GetMessageFields';
import type { ParamData } from '@/types/types';
import { notify } from '@kyvg/vue3-notification';
import { computed, ref } from 'vue';
import RosMsgComponent from './RosMsgComponent.vue';


const props = defineProps<{
  category: 'options'
  data_key: string
}>()

const edit_node_store = useEditNodeStore()
const editor_store = useEditorStore()
const ros_store = useROSStore()

const param = computed<ParamData | undefined>(() =>
  edit_node_store.new_node_options.find((x) => x.key === props.data_key)
)

const topic_ref_param = computed<ParamData | undefined>(() => 
  edit_node_store.new_node_options.find((x) => x.value.type === RosTopicType_Name)
)

const fields = ref<Record<string, never>>({})

const field_types = ref<Record<string, any>>({})

// This is set by the message_fields callbacks
// and used to force full re-renders of the nested form
const msg_name = ref<string>('')

function fetchRosMessageDefault() {
  if (topic_ref_param.value === undefined) {
    console.warn("Nothing to fetch")
    return
  }
  const message_type = (topic_ref_param.value.value.value as RosType).type_str
  ros_store.get_message_fields_service.callService(
    {
      message_type: message_type
    } as GetMessageFieldsRequest,
    (response: GetMessageFieldsResponse) => {
      console.log(response)
      if (response.success) {
        fields.value = JSON.parse(response.fields)
        field_types.value = JSON.parse(response.field_types)
        edit_node_store.updateParamValue(props.category, props.data_key, fields.value)
        msg_name.value = message_type
        notify({
          title: 'Successfully loaded message fields!',
          text: '',
          type: 'success'
        })
      } else {
        notify({
          title: 'Failed to load message fields!',
          text: response.error_message,
          type: 'warn'
        })
      }
    },
    (error: string) => {
      notify({
        title: 'Failed to call GetMessageFields service!',
        text: error,
        type: 'error'
      })
    }
  )
  console.log("Sent message fields request")
}

</script>

<template>
  <div class="d-flex align-items-center justify-content-between mb-1">
    <label>
      {{ param?.key }}
    </label>
    <button v-if="topic_ref_param"
      class="btn btn-primary btn-sm"
      @click="fetchRosMessageDefault"
    >
      Fetch default message fields
    </button>
  </div>
  <div class="list-group d-table w-100">
    <RosMsgComponent
      :key="msg_name"
      :field_dict="fields"
      :field_types="field_types"
      :field_key="[]"
      :render_content="true"
    />
  </div>
</template>