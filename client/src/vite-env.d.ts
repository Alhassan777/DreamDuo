/// <reference types="vite/client" />

declare module 'react-beautiful-dnd' {
  import * as React from 'react';

  export type DraggableId = string;
  export type DroppableId = string;

  export interface DraggableLocation {
    droppableId: DroppableId;
    index: number;
  }

  export interface DroppableProvided {
    innerRef: (element: HTMLElement | null) => void;
    droppableProps: {
      [key: string]: any;
    };
    placeholder?: React.ReactElement<any>;
  }

  export interface DraggableProvided {
    innerRef: (element: HTMLElement | null) => void;
    draggableProps: {
      [key: string]: any;
    };
    dragHandleProps: {
      [key: string]: any;
    } | null;
  }

  export interface DropResult {
    draggableId: DraggableId;
    type: string;
    source: DraggableLocation;
    destination: DraggableLocation | null;
    reason: 'DROP' | 'CANCEL';
  }

  export interface DroppableProps {
    droppableId: DroppableId;
    type?: string;
    direction?: 'vertical' | 'horizontal';
    children: (provided: DroppableProvided) => React.ReactElement<any>;
  }

  export interface DraggableProps {
    draggableId: DraggableId;
    index: number;
    children: (provided: DraggableProvided) => React.ReactElement<any>;
  }

  export class Droppable extends React.Component<DroppableProps> {}
  export class Draggable extends React.Component<DraggableProps> {}
  export class DragDropContext extends React.Component<{
    onDragEnd: (result: DropResult) => void;
  }> {}
}