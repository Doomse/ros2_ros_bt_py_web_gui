/*
 * Copyright 2024 FZI Forschungszentrum Informatik
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
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { Service, Topic, Ros } from 'roslib'
import type {
  Packages,
  MessageTypes,
  Channels,
  TreeStructureList,
  TreeStateList,
  TreeDataList
} from '@/types/types'
import type {
  ServicesForTypeRequest,
  ServicesForTypeResponse
} from '@/types/services/ServicesForType'
import type {
  ControlTreeExecutionRequest,
  ControlTreeExecutionResponse
} from '@/types/services/ControlTreeExecution'
import type { LoadTreeRequest, LoadTreeResponse } from '@/types/services/LoadTree'
import type { ClearTreeRequest, ClearTreeResponse } from '@/types/services/ClearTree'
import type { FixYamlRequest, FixYamlResponse } from '@/types/services/FixYaml'
import { useMessasgeStore } from './message'
import { usePackageStore } from './package'
import { notify } from '@kyvg/vue3-notification'
import type {
  GetAvailableNodesRequest,
  GetAvailableNodesResponse
} from '@/types/services/GetAvailableNodes'
import type {
  GetMessageFieldsRequest,
  GetMessageFieldsResponse
} from '@/types/services/GetMessageFields'
import type { MorphNodeRequest, MorphNodeResponse } from '@/types/services/MorphNode'
import type { WireNodeDataRequest, WireNodeDataResponse } from '@/types/services/WireNodeData'
import type { RemoveNodeRequest, RemoveNodeResponse } from '@/types/services/RemoveNode'
import type { SetOptionsRequest, SetOptionsResponse } from '@/types/services/SetOptions'
import type { MoveNodeRequest, MoveNodeResponse } from '@/types/services/MoveNode'
import type { AddNodeAtIndexRequest, AddNodeAtIndexResponse } from '@/types/services/AddNodeAtIndex'
import type { ReplaceNodeRequest, ReplaceNodeResponse } from '@/types/services/ReplaceNode'
import type {
  GenerateSubtreeRequest,
  GenerateSubtreeResponse
} from '@/types/services/GenerateSubtree'
import type { SetBoolRequest, SetBoolResponse } from '@/types/services/SetBool'
import type {
  GetFolderStructureRequest,
  GetFolderStructureResponse
} from '@/types/services/GetFolderStructure'
import type {
  GetStorageFoldersRequest,
  GetStorageFoldersResponse
} from '@/types/services/GetStorageFolders'
import type {
  GetPackageStructureRequest,
  GetPackageStructureResponse
} from '@/types/services/GetPackageStructure'
import type { SaveTreeRequest, SaveTreeResponse } from '@/types/services/SaveTree'
import type {
  LoadTreeFromPathRequest,
  LoadTreeFromPathResponse
} from '@/types/services/LoadTreeFromPath'
import type { ChangeTreeNameRequest, ChangeTreeNameResponse } from '@/types/services/ChangeTreeName'
import { useNodesStore } from './nodes'
import { useEditorStore } from './editor'


export const useROSStore = defineStore(
  'ros',
  () => {
    const messages_store = useMessasgeStore()
    const packages_store = usePackageStore()
    const nodes_store = useNodesStore()
    const editor_store = useEditorStore()
    const ros = new Ros({})
    const connected = computed<boolean>(() => ros.isConnected)
    const url = ref<string>('ws://' + window.location.hostname + ':9090')
    const namespace = ref<string>('')
    const available_namespaces = ref<string[]>(['/'])

    let services_for_type_service :
      Service<ServicesForTypeRequest, ServicesForTypeResponse> =
      new Service({
        ros: ros,
        name: '/rosapi/services_for_type',
        serviceType: 'rosapi/ServicesForType'
      })

    let load_tree_service :
      Service<LoadTreeRequest, LoadTreeResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'load_tree',
        serviceType: 'ros_bt_py_interfaces/srv/LoadTree'
      })

    let fix_yaml_service : Service<FixYamlRequest, FixYamlResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'fix_yaml',
        serviceType: 'ros_bt_py_interfaces/srv/FixYaml'
      })

    let control_tree_execution_service :
      Service<ControlTreeExecutionRequest, ControlTreeExecutionResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'control_tree_execution',
        serviceType: 'ros_bt_py_interfaces/srv/ControlTreeExecution'
      })

    let clear_tree_service : Service<ClearTreeRequest, ClearTreeResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'clear',
        serviceType: 'ros_bt_py_interfaces/srv/ClearTree'
      })

    let set_publish_subtrees_service : 
      Service<SetBoolRequest, SetBoolResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'debug/set_publish_subtrees',
        serviceType: 'std_srvs/srv/SetBool'
      })

    let set_publish_data_service : Service<SetBoolRequest, SetBoolResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'debug/set_publish_data',
        serviceType: 'std_srvs/srv/SetBool'
      })

    let tree_structure_sub : Topic<TreeStructureList> =
      new Topic({
        ros: ros,
        name: namespace.value + 'tree_structure_list',
        messageType: 'ros_bt_py_interfaces/msg/TreeStructureList',
        latch: true,
        reconnect_on_close: true
      })

    let tree_state_sub : Topic<TreeStateList> =
      new Topic({
        ros: ros,
        name: namespace.value + 'tree_state_list',
        messageType: 'ros_bt_py_interfaces/msg/TreeStateList',
        latch: true,
        reconnect_on_close: true
      })

    let tree_data_sub : Topic<TreeDataList> =
      new Topic({
        ros: ros,
        name: namespace.value + 'tree_data_list',
        messageType: 'ros_bt_py_interfaces/msg/TreeDataList',
        latch: true,
        reconnect_on_close: true
      })

    let packages_sub : Topic<Packages> =
      new Topic({
        ros: ros,
        name: namespace.value + 'packages',
        messageType: 'ros_bt_py_interfaces/msg/Packages',
        latch: true,
        reconnect_on_close: true
      })

    let messages_sub : Topic<MessageTypes> =
      new Topic({
        ros: ros,
        name: namespace.value + 'message_types',
        messageType: 'ros_bt_py_interfaces/msg/MessageTypes',
        latch: true,
        reconnect_on_close: true
      })

    let channels_sub : Topic<Channels> =
      new Topic({
        ros: ros,
        name: namespace.value + 'message_channels',
        messageType: 'ros_bt_py_interfaces/msg/MessageChannels',
        latch: true,
        reconnect_on_close: true
      })

    let get_available_nodes_service :
      Service<GetAvailableNodesRequest, GetAvailableNodesResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'get_available_nodes',
        serviceType: 'ros_bt_py_interfaces/srv/GetAvailableNodes'
      })

    let get_message_fields_service :
      Service<GetMessageFieldsRequest, GetMessageFieldsResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'get_message_fields',
        serviceType: 'ros_bt_py_interfaces/srv/GetMessageFields'
      })

    let unwire_data_service : Service<WireNodeDataRequest, WireNodeDataResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'unwire_data',
        serviceType: 'ros_bt_py_interfaces/srv/WireNodeData'
      })

    let remove_node_service : Service<RemoveNodeRequest, RemoveNodeResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'remove_node',
        serviceType: 'ros_bt_pt_interfaces/srv/RemoveNode'
      })

    let replace_node_service : Service<ReplaceNodeRequest, ReplaceNodeResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'replace_node',
        serviceType: 'ros_bt_pt_interfaces/srv/ReplaceNode'
      })

    let set_options_service : Service<SetOptionsRequest, SetOptionsResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'set_options',
        serviceType: 'ros_bt_pt_interfaces/srv/SetOptions'
      })

    let morph_node_service : Service<MorphNodeRequest, MorphNodeResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'morph_node',
        serviceType: 'ros_bt_pt_interfaces/srv/MorphNode'
      })

    let move_node_service : Service<MoveNodeRequest, MoveNodeResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'move_node',
        serviceType: 'ros_bt_py_interfaces/srv/MoveNode'
      })

    let add_node_at_index_service :
      Service<AddNodeAtIndexRequest, AddNodeAtIndexResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'add_node_at_index',
        serviceType: 'ros_bt_py_interfaces/srv/AddNodeAtIndex'
      })

    let wire_data_service : 
      Service<WireNodeDataRequest, WireNodeDataResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'wire_data',
        serviceType: 'ros_bt_py_interfaces/srv/WireNodeData'
      })

    let generate_subtree_service :
      Service<GenerateSubtreeRequest, GenerateSubtreeResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'generate_subtree',
        serviceType: 'ros_bt_py_interfaces/srv/GenerateSubtree'
      })

    let get_storage_folders_service :
      Service<GetStorageFoldersRequest, GetStorageFoldersResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'get_storage_folders',
        serviceType: 'ros_bt_py_interfaces/srv/GetStorageFolders'
      })

    let get_folder_structure_service :
      Service<GetFolderStructureRequest, GetFolderStructureResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'get_folder_structure',
        serviceType: 'ros_bt_py_interfaces/srv/GetFolderStructure'
      })

    let get_package_structure_service :
      Service<GetPackageStructureRequest, GetPackageStructureResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'get_package_structure',
        serviceType: 'ros_bt_py_interfaces/srv/GetPackageStructure'
      })

    let save_tree_service : 
      Service<SaveTreeRequest, SaveTreeResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'save_tree',
        serviceType: 'ros_bt_py_interfaces/srv/SaveTree'
      })

    let change_tree_name_service :
      Service<ChangeTreeNameRequest, ChangeTreeNameResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'change_tree_name',
        serviceType: 'ros_bt_py_interfaces/srv/ChangeTreeName'
      })

    let load_tree_from_path_service :
      Service<LoadTreeFromPathRequest, LoadTreeFromPathResponse> =
      new Service({
        ros: ros,
        name: namespace.value + 'load_tree_from_path',
        serviceType: 'ros_bt_py_interfaces/srv/LoadTreeFromPath'
      })

    ros.on('connection', () => {
      hasConnected()
    })

    ros.on('close', () => {
      hasDisconnected()
    })

    ros.on('error', () => {
      notify({
        title: 'ROS connection error!',
        type: 'error'
      })
    })

    function updateROSServices() {
      tree_structure_sub.unsubscribe()
      tree_structure_sub.removeAllListeners()
      tree_structure_sub = new Topic({
        ros: ros,
        name: namespace.value + 'tree_structure_list',
        messageType: 'ros_bt_py_interfaces/msg/TreeStructureList',
        latch: true,
        reconnect_on_close: true
      })

      tree_state_sub.unsubscribe()
      tree_state_sub.removeAllListeners()
      tree_state_sub = new Topic({
        ros: ros,
        name: namespace.value + 'tree_state_list',
        messageType: 'ros_bt_py_interfaces/msg/TreeStateList',
        latch: true,
        reconnect_on_close: true
      })

      tree_data_sub.unsubscribe()
      tree_data_sub.removeAllListeners()
      tree_data_sub = new Topic({
        ros: ros,
        name: namespace.value + 'tree_data_list',
        messageType: 'ros_bt_py_interfaces/msg/TreeDataList',
        latch: true,
        reconnect_on_close: true
      })

      messages_sub.unsubscribe()
      messages_sub.removeAllListeners()
      messages_sub = new Topic({
        ros: ros,
        name: namespace.value + 'message_types',
        messageType: 'ros_bt_py_interfaces/msg/MessageTypes',
        latch: true,
        reconnect_on_close: true
      })

      packages_sub.unsubscribe()
      packages_sub.removeAllListeners()
      packages_sub = new Topic({
        ros: ros,
        name: namespace.value + 'packages',
        messageType: 'ros_bt_py_interfaces/msg/Packages',
        latch: true,
        reconnect_on_close: true
      })

      channels_sub.unsubscribe()
      channels_sub.removeAllListeners()
      channels_sub = new Topic({
        ros: ros,
        name: namespace.value + 'message_channels',
        messageType: 'ros_bt_py_interfaces/msg/MessageChannels',
        latch: true,
        reconnect_on_close: true
      })

      set_publish_subtrees_service = new Service({
        ros: ros,
        name: namespace.value + 'debug/set_publish_subtrees',
        serviceType: 'std_srvs/srv/SetBool'
      })

      set_publish_data_service = new Service({
        ros: ros,
        name: namespace.value + 'debug/set_publish_data',
        serviceType: 'std_srvs/srv/SetBool'
      })

      services_for_type_service = new Service({
        ros: ros,
        name: '/rosapi/services_for_type',
        serviceType: 'rosapi/ServicesForType'
      })

      load_tree_service = new Service({
        ros: ros,
        name: namespace.value + 'load_tree',
        serviceType: 'ros_bt_py_interfaces/srv/LoadTree'
      })

      fix_yaml_service = new Service({
        ros: ros,
        name: namespace.value + 'fix_yaml',
        serviceType: 'ros_bt_py_interfaces/srv/FixYaml'
      })

      control_tree_execution_service = new Service({
        ros: ros,
        name: namespace.value + 'control_tree_execution',
        serviceType: 'ros_bt_py_interfaces/srv/ControlTreeExecution'
      })

      clear_tree_service = new Service({
        ros: ros,
        name: namespace.value + 'clear',
        serviceType: 'ros_bt_py_interfaces/srv/ClearTree'
      })

      get_available_nodes_service = new Service({
        ros: ros,
        name: namespace.value + 'get_available_nodes',
        serviceType: 'ros_bt_py_interfaces/srv/GetAvailableNodes'
      })

      get_message_fields_service = new Service({
        ros: ros,
        name: namespace.value + 'get_message_fields',
        serviceType: 'ros_bt_py_interfaces/srv/GetMessageFields'
      })

      unwire_data_service = new Service({
        ros: ros,
        name: namespace.value + 'unwire_data',
        serviceType: 'ros_bt_py_interfaces/srv/WireNodeData'
      })

      remove_node_service = new Service({
        ros: ros,
        name: namespace.value + 'remove_node',
        serviceType: 'ros_bt_py_interfaces/srv/RemoveNode'
      })

      replace_node_service = new Service({
        ros: ros,
        name: namespace.value + 'replace_node',
        serviceType: 'ros_bt_pt_interfaces/srv/ReplaceNode'
      })

      set_options_service = new Service({
        ros: ros,
        name: namespace.value + 'set_options',
        serviceType: 'ros_bt_py_interfaces/srv/SetOptions'
      })

      morph_node_service = new Service({
        ros: ros,
        name: namespace.value + 'morph_node',
        serviceType: 'ros_bt_py_interfaces/srv/MorphNode'
      })

      generate_subtree_service = new Service({
        ros: ros,
        name: namespace.value + 'generate_subtree',
        serviceType: 'ros_bt_py_interfaces/srv/GenerateSubtree'
      })

      wire_data_service = new Service({
        ros: ros,
        name: namespace.value + 'wire_data',
        serviceType: 'ros_bt_py_interfaces/srv/WireNodeData'
      })

      add_node_at_index_service = new Service({
        ros: ros,
        name: namespace.value + 'add_node_at_index',
        serviceType: 'ros_bt_py_interfaces/srv/AddNodeAtIndex'
      })

      move_node_service = new Service({
        ros: ros,
        name: namespace.value + 'move_node',
        serviceType: 'ros_bt_py_interfaces/srv/MoveNode'
      })

      get_storage_folders_service = new Service({
        ros: ros,
        name: namespace.value + 'get_storage_folders',
        serviceType: 'ros_bt_py_interfaces/srv/GetStorageFolders'
      })

      get_folder_structure_service = new Service({
        ros: ros,
        name: namespace.value + 'get_folder_structure',
        serviceType: 'ros_bt_py_interfaces/srv/GetFolderStructure'
      })

      get_package_structure_service = new Service({
        ros: ros,
        name: namespace.value + 'get_package_structure',
        serviceType: 'ros_bt_py_interfaces/srv/GetPackageStructure'
      })

      save_tree_service = new Service({
        ros: ros,
        name: namespace.value + 'save_tree',
        serviceType: 'ros_bt_py_interfaces/srv/SaveTree'
      })

      change_tree_name_service = new Service({
        ros: ros,
        name: namespace.value + 'change_tree_name',
        serviceType: 'ros_bt_py_interfaces/srv/ChangeTreeName'
      })

      load_tree_from_path_service = new Service({
        ros: ros,
        name: namespace.value + 'load_tree_from_path',
        serviceType: 'ros_bt_py_interfaces/srv/LoadTreeFromPath'
      })

      nodes_store.getNodes('')
    }

    function connect() {
      ros.connect(url.value)
    }

    function setUrl(new_url: string) {
      url.value = new_url
    }

    function hasConnected() {
      notify({
        title: 'ROS connection established!',
        type: 'success'
      })
    }

    function hasDisconnected() {
      messages_store.areMessagesAvailable(false)
      packages_store.arePackagesAvailable(false)

      editor_store.enableSubtreePublishing(false)
      editor_store.publish_data = false

      notify({
        title: 'ROS connection closed!',
        type: 'warn'
      })
    }

    function changeNamespace(new_namespace: string) {
      namespace.value = new_namespace
      if (available_namespaces.value.indexOf(new_namespace) === -1) {
        available_namespaces.value.push(namespace.value)
      }
      updateROSServices()
    }

    function setAvailableNamespaces(new_namespaces: string[]) {
      available_namespaces.value = new_namespaces
    }

    return {
      ros,
      connected,
      url,
      namespace,
      available_namespaces,
      services_for_type_service,
      load_tree_service,
      fix_yaml_service,
      control_tree_execution_service,
      clear_tree_service,
      get_available_nodes_service,
      get_message_fields_service,
      unwire_data_service,
      remove_node_service,
      morph_node_service,
      set_options_service,
      move_node_service,
      replace_node_service,
      wire_data_service,
      add_node_at_index_service,
      generate_subtree_service,
      set_publish_subtrees_service,
      set_publish_data_service,
      get_storage_folders_service,
      get_folder_structure_service,
      get_package_structure_service,
      save_tree_service,
      change_tree_name_service,
      load_tree_from_path_service,
      tree_structure_sub,
      tree_state_sub,
      tree_data_sub,
      packages_sub,
      messages_sub,
      channels_sub,
      connect,
      setUrl,
      changeNamespace,
      setAvailableNamespaces,
      hasConnected,
      hasDisconnected,
      updateROSServices
    }
  },
  {
    persist: {
      pick: ['namespace', 'url', 'available_namespaces'],
      storage: localStorage,
      afterHydrate: (context) => {
        context.store.updateROSServices()
        context.store.connect()
      }
    }
  }
)
