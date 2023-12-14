import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import ROSLIB from 'roslib'
import type { Packages, DebugSettings, Messages } from '@/types/types'
import type {
  ServicesForTypeRequest,
  ServicesForTypeResponse
} from '@/types/services/ServicesForType'
import type { ContinueRequest, ContinueResponse } from '@/types/services/Continue'
import type {
  SetExecutionModeRequest,
  SetExecutionModeResponse
} from '@/types/services/SetExecutionMode'
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
import type { AddNodeRequest, AddNodeResponse } from '@/types/services/AddNode'
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
import type {
  GenerateSubtreeRequest,
  GenerateSubtreeResponse
} from '@/types/services/GenerateSubtree'

export const useROSStore = defineStore(
  'ros',
  () => {
    const messages_store = useMessasgeStore()
    const packages_store = usePackageStore()

    const ros = ref<ROSLIB.Ros>(new ROSLIB.Ros({}))
    const connected = computed<boolean>(() => ros.value.isConnected)
    const url = ref<string>('ws://' + window.location.hostname + ':9090')
    const namespace = ref<string>('/')
    const available_namespaces = ref<string[]>(['/'])

    const services_for_type_service = ref<
      ROSLIB.Service<ServicesForTypeRequest, ServicesForTypeResponse>
    >(
      new ROSLIB.Service({
        ros: ros.value,
        name: '/rosapi/services_for_type',
        serviceType: 'rosapi/ServicesForType'
      })
    )

    const step_service = ref<ROSLIB.Service<ContinueRequest, ContinueResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'debug/continue',
        serviceType: 'ros_bt_py_interfaces/srv/Continue'
      })
    )

    const set_execution_mode_service = ref<
      ROSLIB.Service<SetExecutionModeRequest, SetExecutionModeResponse>
    >(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'debug/set_execution_mode',
        serviceType: 'ros_bt_py_interfaces/srv/SetExecutionMode'
      })
    )

    const debug_settings_sub = ref<ROSLIB.Topic<DebugSettings>>(
      new ROSLIB.Topic({
        ros: ros.value,
        name: namespace.value + 'debug/debug_settings',
        messageType: 'ros_bt_py_interfaces/msg/DebugSettings',
        latch: true,
        reconnect_on_close: true
      })
    )

    const load_tree_service = ref<ROSLIB.Service<LoadTreeRequest, LoadTreeResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'load_tree',
        serviceType: 'ros_bt_py_interfaces/srv/LoadTree'
      })
    )

    const fix_yaml_service = ref<ROSLIB.Service<FixYamlRequest, FixYamlResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'fix_yaml',
        serviceType: 'ros_bt_py_interfaces/srv/FixYaml'
      })
    )

    const control_tree_execution_service = ref<
      ROSLIB.Service<ControlTreeExecutionRequest, ControlTreeExecutionResponse>
    >(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'control_tree_execution',
        serviceType: 'ros_bt_py_interfaces/srv/ControlTreeExecution'
      })
    )

    const clear_tree_service = ref<ROSLIB.Service<ClearTreeRequest, ClearTreeResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'clear',
        serviceType: 'ros_bt_py_interfaces/srv/ClearTree'
      })
    )

    const add_node_service = ref<ROSLIB.Service<AddNodeRequest, AddNodeResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'add_node',
        serviceType: 'ros_bt_py_interfaces/srv/AddNode'
      })
    )

    const packages_sub = ref<ROSLIB.Topic<Packages>>(
      new ROSLIB.Topic({
        ros: ros.value,
        name: namespace.value + 'packages',
        messageType: 'ros_bt_py_interfaces/msg/Packages',
        latch: true,
        reconnect_on_close: true
      })
    )
    const messages_sub = ref<ROSLIB.Topic<Messages>>(
      new ROSLIB.Topic({
        ros: ros.value,
        name: namespace.value + 'messages',
        messageType: 'ros_bt_py_interfaces/msg/Messages',
        latch: true,
        reconnect_on_close: true
      })
    )

    const get_available_nodes_service = ref<
      ROSLIB.Service<GetAvailableNodesRequest, GetAvailableNodesResponse>
    >(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'get_available_nodes',
        serviceType: 'ros_bt_py_interfaces/srv/GetAvailableNodes'
      })
    )

    const get_message_fields_service = ref<
      ROSLIB.Service<GetMessageFieldsRequest, GetMessageFieldsResponse>
    >(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'get_message_fields',
        serviceType: 'ros_bt_py_interfaces/srv/GetMessageFields'
      })
    )

    const unwire_data_service = ref<ROSLIB.Service<WireNodeDataRequest, WireNodeDataResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'unwire_data',
        serviceType: 'ros_bt_py_interfaces/srv/WireNodeData'
      })
    )

    const remove_node_service = ref<ROSLIB.Service<RemoveNodeRequest, RemoveNodeResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'remove_node',
        serviceType: 'ros_bt_pt_interfaces/srv/RemoveNode'
      })
    )

    const set_options_service = ref<ROSLIB.Service<SetOptionsRequest, SetOptionsResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'set_options',
        serviceType: 'ros_bt_pt_interfaces/srv/SetOptions'
      })
    )

    const morph_node_service = ref<ROSLIB.Service<MorphNodeRequest, MorphNodeResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'morph_node',
        serviceType: 'ros_bt_pt_interfaces/srv/MorphNode'
      })
    )

    const move_node_service = ref<ROSLIB.Service<MoveNodeRequest, MoveNodeResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'move_node',
        serviceType: 'ros_bt_py_interfaces/srv/MoveNode'
      })
    )

    const add_node_at_index_service = ref<
      ROSLIB.Service<AddNodeAtIndexRequest, AddNodeAtIndexResponse>
    >(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'add_node_at_index',
        serviceType: 'ros_bt_py_interfaces/srv/AddNodeAtIndex'
      })
    )

    const wire_data_service = ref<ROSLIB.Service<WireNodeDataRequest, WireNodeDataResponse>>(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'wire_data',
        serviceType: 'ros_bt_py_interfaces/srv/WireNodeData'
      })
    )

    const generate_subtree_service = ref<
      ROSLIB.Service<GenerateSubtreeRequest, GenerateSubtreeResponse>
    >(
      new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'generate_subtree',
        serviceType: 'ros_bt_py_interfaces/srv/GenerateSubtree'
      })
    )

    ros.value.on('connection', () => {
      hasConnected()
    })

    ros.value.on('close', () => {
      hasDisconnected()
    })

    ros.value.on('error', () => {
      notify({
        title: 'ROS connection error!',
        type: 'error'
      })
    })

    function updateROSServices() {
      debug_settings_sub.value.unsubscribe()
      debug_settings_sub.value.removeAllListeners()
      debug_settings_sub.value = new ROSLIB.Topic({
        ros: ros.value,
        name: namespace.value + 'debug/debug_settings',
        messageType: 'ros_bt_py_interfaces/msg/DebugSettings',
        latch: true,
        reconnect_on_close: true
      })

      messages_sub.value.unsubscribe()
      messages_sub.value.removeAllListeners()
      messages_sub.value = new ROSLIB.Topic({
        ros: ros.value,
        name: namespace.value + 'messages',
        messageType: 'ros_bt_py_interfaces/msg/Messages',
        latch: true,
        reconnect_on_close: true
      })

      packages_sub.value.unsubscribe()
      packages_sub.value.removeAllListeners()
      packages_sub.value = new ROSLIB.Topic({
        ros: ros.value,
        name: namespace.value + 'packages',
        messageType: 'ros_bt_py_interfaces/msg/Packages',
        latch: true,
        reconnect_on_close: true
      })

      set_execution_mode_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'debug/set_execution_mode',
        serviceType: 'ros_bt_py_interfaces/srv/SetExecutionMode'
      })

      services_for_type_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: '/rosapi/services_for_type',
        serviceType: 'rosapi/ServicesForType'
      })

      step_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'debug/continue',
        serviceType: 'ros_bt_py_interfaces/srv/Continue'
      })

      load_tree_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'load_tree',
        serviceType: 'ros_bt_py_interfaces/srv/LoadTree'
      })

      fix_yaml_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'fix_yaml',
        serviceType: 'ros_bt_py_interfaces/srv/FixYaml'
      })

      control_tree_execution_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'control_tree_execution',
        serviceType: 'ros_bt_py_interfaces/srv/ControlTreeExecution'
      })

      clear_tree_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'clear',
        serviceType: 'ros_bt_py_interfaces/srv/ClearTree'
      })

      get_available_nodes_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'get_available_nodes',
        serviceType: 'ros_bt_py_interfaces/srv/GetAvailableNodes'
      })

      add_node_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'add_node',
        serviceType: 'ros_bt_py_interfaces/srv/AddNode'
      })
      get_message_fields_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'get_message_fields',
        serviceType: 'ros_bt_py_interfaces/srv/GetMessageFields'
      })
      unwire_data_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'unwire_data',
        serviceType: 'ros_bt_py_interfaces/srv/WireNodeData'
      })
      remove_node_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'remove_node',
        serviceType: 'ros_bt_py_interfaces/srv/RemoveNode'
      })
      set_options_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'set_options',
        serviceType: 'ros_bt_py_interfaces/srv/SetOptions'
      })
      morph_node_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'morph_node',
        serviceType: 'ros_bt_py_interfaces/srv/MorphNode'
      })
      generate_subtree_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'generate_subtree',
        serviceType: 'ros_bt_py_interfaces/srv/GenerateSubtree'
      })
      wire_data_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'wire_data',
        serviceType: 'ros_bt_py_interfaces/srv/WireNodeData'
      })
      add_node_at_index_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'add_node_at_index',
        serviceType: 'ros_bt_py_interfaces/srv/AddNodeAtIndex'
      })
      move_node_service.value = new ROSLIB.Service({
        ros: ros.value,
        name: namespace.value + 'move_node',
        serviceType: 'ros_bt_py_interfaces/srv/MoveNode'
      })
    }

    function connect() {
      ros.value.connect(url.value)
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
      set_execution_mode_service,
      load_tree_service,
      step_service,
      fix_yaml_service,
      control_tree_execution_service,
      clear_tree_service,
      get_available_nodes_service,
      add_node_service,
      get_message_fields_service,
      unwire_data_service,
      remove_node_service,
      morph_node_service,
      set_options_service,
      move_node_service,
      wire_data_service,
      add_node_at_index_service,
      generate_subtree_service,
      debug_settings_sub,
      packages_sub,
      messages_sub,
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
      paths: ['namespace', 'url', 'available_namespaces'],
      storage: sessionStorage,
      afterRestore: (context) => {
        context.store.updateROSServices()
        context.store.connect()
      }
    }
  }
)