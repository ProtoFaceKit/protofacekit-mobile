export enum TimelineDraggingState {
    // Dragging has not started
    IDLE,
    // Touch has started and is waiting for user to continue
    WAITING,
    // User moved before the dragging timeout completed
    // and so the drag has been cancelled
    MOVED,
    // Ready to begin dragging
    DRAGGING,
}

export type TimelineDragging =
    | { state: TimelineDraggingState.IDLE }
    | {
          state: TimelineDraggingState.WAITING;
          timeout: ReturnType<typeof setTimeout>;
      }
    | { state: TimelineDraggingState.MOVED }
    | {
          state: TimelineDraggingState.DRAGGING;
          draggedIndex: number;
          dragOverIndex: number | null;
      };
