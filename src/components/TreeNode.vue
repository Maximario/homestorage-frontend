<template>
  <div class="tree-node" :style="{ paddingLeft: level * 20 + 'px' }">
    <div
        class="tree-node__item"
        :class="{
        'tree-node__item--selected': node.id === selectedId,
        'tree-node__item--disabled': !isValidType,
      }"
        @click="handleClick"
    >
      <span
          v-if="node.children.length > 0"
          class="tree-node__toggle"
          @click.stop="toggle"
      >
        {{ isExpanded ? '▼' : '▶' }}
      </span>
      <span v-else class="tree-node__toggle tree-node__toggle--empty">•</span>
      <span class="tree-node__icon">{{ getIcon(node.type) }}</span>
      <span class="tree-node__name">{{ node.name }}</span>
      <span v-if="!isValidType" class="tree-node__badge">(недоступно)</span>
    </div>
    <div v-if="isExpanded && node.children.length > 0" class="tree-node__children">
      <TreeNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :level="level + 1"
          :selected-id="selectedId"
          :expanded-ids="expandedIds"
          :valid-types="validTypes"
          @select="$emit('select', $event)"
          @toggle="$emit('toggle', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface TreeNodeData {
  id: string;
  name: string;
  type: string;
  children: TreeNodeData[];
}

const props = defineProps<{
  node: TreeNodeData;
  level: number;
  selectedId?: string;
  expandedIds: Set<string>;
  validTypes: string[];
}>();

const emit = defineEmits<{
  (e: 'select', node: TreeNodeData): void;
  (e: 'toggle', nodeId: string): void;
}>();

const isExpanded = computed(() => props.expandedIds.has(props.node.id));

const isValidType = computed(() => {
  if (props.validTypes.length === 0) return true;
  return props.validTypes.includes(props.node.type);
});

const getIcon = (type: string): string => {
  const icons: Record<string, string> = {
    BUILDING: '🏢',
    APARTMENT: '🏠',
    ROOM: '🚪',
    FURNITURE: '🪑',
    SHELF: '📚',
    BOX: '📦',
    DRAWER: '🗄️',
  };
  return icons[type] || '📁';
};

const handleClick = () => {
  if (isValidType.value) {
    emit('select', props.node);
  }
};

const toggle = () => {
  emit('toggle', props.node.id);
};
</script>

<style scoped>
.tree-node {
  user-select: none;
}

.tree-node__item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
  gap: 4px;
}

.tree-node__item:hover {
  background: #f0f4ff;
}

.tree-node__item--selected {
  background: #e3f2fd;
  font-weight: 600;
}

.tree-node__item--selected .tree-node__name {
  color: #1976d2;
}

.tree-node__item--disabled {
  color: #aaa;
  cursor: not-allowed;
}

.tree-node__item--disabled:hover {
  background: transparent;
}

.tree-node__toggle {
  display: inline-block;
  width: 20px;
  text-align: center;
  color: #666;
  font-size: 12px;
  flex-shrink: 0;
}

.tree-node__toggle--empty {
  color: #ddd;
}

.tree-node__icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-right: 4px;
}

.tree-node__name {
  flex: 1;
  color: #333;
}

.tree-node__badge {
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  padding: 0 8px;
  border-radius: 12px;
}

.tree-node__children {
  padding-left: 4px;
}
</style>