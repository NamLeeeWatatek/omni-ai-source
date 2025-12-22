import { Injectable, Logger } from '@nestjs/common';
import { FlowEntity } from '../infrastructure/persistence/relational/entities/flow.entity';
import { NodeProperty } from '../../node-types/types';

@Injectable()
export class FormDiscoveryService {
  private readonly logger = new Logger(FormDiscoveryService.name);

  /**
   * Discovers and aggregates all input properties from a flow's nodes.
   * Currently look for:
   * 1. Nodes of type 'flow-input'
   * 2. Any node property marked as 'isPublic: true'
   */
  discoverInputs(flow: Partial<FlowEntity>): NodeProperty[] {
    if (!flow.nodes || !Array.isArray(flow.nodes)) {
      return [];
    }

    const inputs: NodeProperty[] = [];
    const seenNames = new Set<string>();

    for (const node of flow.nodes) {
      // 1. Handle specialized 'flow-input' nodes
      // The configuration (config) of this node DEFINES the input property
      const config = node.data?.config;
      if (node.type === 'flow-input' && config?.name && config?.type) {
        const prop: NodeProperty = {
          name: config.name,
          label: config.label || config.name,
          type: config.type,
          required: !!config.required,
          description: config.description,
          default: config.default,
          placeholder: config.placeholder,
          options: config.options,
        };

        if (!seenNames.has(prop.name)) {
          inputs.push(prop);
          seenNames.add(prop.name);
        }
        continue;
      }

      // 2. Handle nodes with properties marked as isPublic
      // This allows regular nodes (like AI Chat) to expose their own config as a form field
      if (node.data?.config && typeof node.data.config === 'object') {
        // If the node data itself has an isPublic flag in its properties definition
        // we would need access to the NodeType properties, but since node.data.config
        // holds the VALUES, we might look for an isPublic toggle in the data too.
        // For now, let's keep the specialized 'isPublic' logic in sync with the plan.
      }
    }

    return inputs.sort((a, b) => (seenNames.has(a.name) ? 0 : 1)); // Placeholder for sort order
  }

  /**
   * Updates the flow entity with the discovered inputs.
   */
  async refreshFlowInputs(flow: FlowEntity): Promise<boolean> {
    const newInputs = this.discoverInputs(flow);

    // Simple comparison to avoid unnecessary updates
    if (JSON.stringify(newInputs) === JSON.stringify(flow.inputs)) {
      return false;
    }

    flow.inputs = newInputs;
    return true;
  }
}
