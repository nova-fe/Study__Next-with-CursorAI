// DOM 요소 가져오기
const todoInput = document.getElementById('todoInput');
const addTodoButton = document.getElementById('addTodo');
const todoList = document.getElementById('todoList');

// TODO 아이템 배열
let todos = JSON.parse(localStorage.getItem('todos')) || [];

// 초기 렌더링
renderTodoList();

// TODO 추가 함수
function addTodoItem() {
  const todoText = todoInput.value.trim();
  
  if(todoText !== '') {
    try {
      // 새로운 TODO 객체 생성
      const todo = {
        id: Date.now(),
        text: todoText,
        completed: false
      };

      // 배열에 추가
      todos.push(todo);
      
      // localStorage에 저장
      saveTodos();
      
      // UI 업데이트
      renderTodo(todo);
      
      // 입력창 초기화
      todoInput.value = '';
    } catch (error) {
      console.error('TODO 추가 중 오류 발생:', error);
    }
  }
}

// localStorage에 todos 저장
function saveTodos() {
  try {
    localStorage.setItem('todos', JSON.stringify(todos));
  } catch (error) {
    console.error('todos 저장 중 오류 발생:', error);
  }
}

// TODO 렌더링 함수
function renderTodo(todo) {
  const li = document.createElement('li');
  
  // 체크박스 생성
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = todo.completed;
  checkbox.addEventListener('change', () => toggleTodo(todo.id));
  
  // 텍스트 추가
  const span = document.createElement('span');
  span.textContent = todo.text;
  
  // 삭제 버튼 생성
  const deleteButton = document.createElement('button');
  deleteButton.textContent = '삭제';
  deleteButton.addEventListener('click', () => deleteTodo(todo.id));
  
  // 요소들 조립
  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(deleteButton);
  
  todoList.appendChild(li);
}

// TODO 상태 토글 함수
function toggleTodo(id) {
  try {
    todos = todos.map(todo => {
      if(todo.id === id) {
        return {...todo, completed: !todo.completed};
      }
      return todo;
    });
    
    // localStorage 업데이트
    saveTodos();
    
    // UI 업데이트
    renderTodoList();
  } catch (error) {
    console.error('TODO 상태 변경 중 오류 발생:', error);
  }
}

// TODO 삭제 함수
function deleteTodo(id) {
  try {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodoList();
  } catch (error) {
    console.error('TODO 삭제 중 오류 발생:', error);
  }
}

// 전체 TODO 목록 렌더링
function renderTodoList() {
  todoList.innerHTML = '';
  todos.forEach(todo => renderTodo(todo));
}

// 이벤트 리스너 등록
addTodoButton.addEventListener('click', addTodoItem);
todoInput.addEventListener('keypress', (e) => {
  if(e.key === 'Enter') {
    addTodoItem();
  }
});
