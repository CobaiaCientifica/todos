const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(entry => entry.username === username);
  if(user){
    request.user = user;
    next();
  } else {
    return response.status(404).json({ error: "User not found"});
  }
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const usernameAlreadyExists = users.find(entry => entry.username === username);
  if(usernameAlreadyExists){
    return response.status(400).json({ error: "Username already in use" });
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  };

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  
  return response.status(200).json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const newToDo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  };
  user.todos.push(newToDo);

  return response.status(201).json(newToDo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { id } = request.params;
  const { user } = request;

  const toDo = user.todos.find(entry => entry.id === id);

  if(toDo){
    const targetUser = users.findIndex(entry => entry === user);
    const targetToDo = users[targetUser].todos.findIndex(entry => entry.id === id);
    users[targetUser].todos[targetToDo].title = title;
    users[targetUser].todos[targetToDo].deadline = new Date(deadline);
    return response.status(200).json(users[targetUser].todos[targetToDo]);
  } else {
    return response.status(404).json({ error: "To Do not found" });
  }
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const toDo = user.todos.find(entry => entry.id === id);

  if(toDo){
    const targetUser = users.findIndex(entry => entry === user);
    const targetToDo = users[targetUser].todos.findIndex(entry => entry.id === id);
    users[targetUser].todos[targetToDo].done = true;
    return response.status(200).json(users[targetUser].todos[targetToDo]);
  } else {
    return response.status(404).json({ error: "To Do not found" });
  }
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const toDo = user.todos.find(entry => entry.id === id);

  if(toDo){
    const targetUser = users.find(entry => {
      if(entry === user){
        entry.todos.splice(toDo, 1);
      }
    });
    return response.status(204).send();
  } else {
    return response.status(404).json({ error: "To Do not found" });
  }
});

module.exports = app;