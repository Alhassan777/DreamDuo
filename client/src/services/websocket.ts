import { io, Socket } from 'socket.io-client';
import { Task } from './tasks';
import { mapTaskResponseToTask } from './tasks';

interface TaskEvent {
  task: any;
}

interface TaskUpdateEvent {
  task: any;
}

interface TaskDeleteEvent {
  taskId: number;
}

interface TaskCompleteEvent {
  taskId: number;
  completed: boolean;
}

class WebSocketService {
  private socket: Socket | null = null;
  private taskListeners: ((task: Task) => void)[] = [];
  private taskUpdateListeners: ((task: Task) => void)[] = [];
  private taskDeleteListeners: ((taskId: number) => void)[] = [];
  private taskCompleteListeners: ((taskId: number, completed: boolean) => void)[] = [];
  private connected = false;

  // Initialize the socket connection
  connect() {
    if (this.socket) return;

    // Use environment variable for WebSocket URL, fallback to localhost for development
    const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3001';
    
    // Connect to the same host as the API but on the WebSocket port
    this.socket = io(WEBSOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    // Set up event listeners
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connected = true;
      
      // The cookie is HttpOnly, so we can't access it directly with js-cookie
      // Instead, we'll rely on the cookie being sent automatically with the request
      // due to withCredentials: true
      this.socket?.emit('authenticate', {});
      console.log('WebSocket authentication request sent');
      
      // Note: The server will extract the token from the cookie automatically
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.connected = false;
    });

    // Task events
    this.socket.on('task_created', (data: TaskEvent) => {
      console.log('Task created event received:', data);
      const task = mapTaskResponseToTask(data.task);
      this.taskListeners.forEach(listener => listener(task));
    });

    this.socket.on('task_updated', (data: TaskUpdateEvent) => {
      console.log('Task updated event received:', data);
      const task = mapTaskResponseToTask(data.task);
      this.taskUpdateListeners.forEach(listener => listener(task));
    });

    this.socket.on('task_deleted', (data: TaskDeleteEvent) => {
      console.log('Task deleted event received:', data);
      this.taskDeleteListeners.forEach(listener => listener(data.taskId));
    });

    this.socket.on('task_completed', (data: TaskCompleteEvent) => {
      console.log('Task completed event received:', data);
      this.taskCompleteListeners.forEach(listener => 
        listener(data.taskId, data.completed));
    });
  }

  // Disconnect the socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Check if socket is connected
  isConnected() {
    return this.connected;
  }

  // Add event listeners
  onTaskCreated(listener: (task: Task) => void) {
    this.taskListeners.push(listener);
    return () => {
      this.taskListeners = this.taskListeners.filter(l => l !== listener);
    };
  }

  onTaskUpdated(listener: (task: Task) => void) {
    this.taskUpdateListeners.push(listener);
    return () => {
      this.taskUpdateListeners = this.taskUpdateListeners.filter(l => l !== listener);
    };
  }

  onTaskDeleted(listener: (taskId: number) => void) {
    this.taskDeleteListeners.push(listener);
    return () => {
      this.taskDeleteListeners = this.taskDeleteListeners.filter(l => l !== listener);
    };
  }

  onTaskCompleted(listener: (taskId: number, completed: boolean) => void) {
    this.taskCompleteListeners.push(listener);
    return () => {
      this.taskCompleteListeners = this.taskCompleteListeners.filter(l => l !== listener);
    };
  }
}

export const websocketService = new WebSocketService();