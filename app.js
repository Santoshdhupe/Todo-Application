const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dateFns = require("date-fns"); 
const path = require("path"); 

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let dataBase = null;

const initializeDBAndServer = async () => {
    try {
        dataBase = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        app.listen(3002, () => {
            console.log("Server running at http://localhost:3002/");
        })
    } catch (error) {
        console.log(`DB Error: ${error.message}`);
        process.exit(1);
    };  
}; 

initializeDBAndServer();

const containsStatus = (query) => {
    return query.status !== undefined;
};

const containsPriority = (query) => {
    return query.priority !== undefined;
};

const containsSearch_q = (query) => {
    return query.search_q !== undefined;
};

const containsCategory = (query) => {
    return query.category !== undefined;    
};

const containsPriorityAndStatus = (query) => {
   return ((query.priority !== undefined) && (query.status !== undefined));
};

const containsPriorityAndCategory = (query) => {
    return ((query.priority !== undefined) && (query.category !== undefined));
};

const containsStatusAndCategory = (query) => {
    return ((query.status !== undefined) && (query.category !== undefined));
}; 

const convertToResponseObject = (data) => {
    return {
        id: data.id,
        todo: data.todo,
        priority: data.priority,
        status: data.status,
        category: data.category,
        dueDate: data.due_date
    };
};

app.get("/todos/", async (request, response) => {
    let data = null;
    let getTodoQuery = '';
    const { search_q = "", priority, status, category } = request.query; 

    switch (true) {
     case containsPriorityAndStatus(request.query):
        if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
            if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
                getTodoQuery = `SELECT * FROM todo WHERE priority = '${priority}' 
                AND status = '${status}';`;
                data = await dataBase.all(getTodoQuery); 
                response.send(data.map((each) => convertToResponseObject(each)));
            } else {
                response.status(400);
                response.send("Invalid Todo Status");
            }
        } else {
            response.status(400);
            response.send("Invalid Todo Priority");
        }
    break;
    case containsPriorityAndCategory(request.query):
        if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
            if (category === "WORK" || category === "HOME" || category === "LEARNING") {
                getTodoQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND category = '${category}';`;
                data = await dataBase.all(getTodoQuery); 
                response.send(data.map((each) => convertToResponseObject(each)));
            } else {
                response.status(400);
                response.send("Invalid Todo Category");
            }
        } else {
            response.status(400);
            response.send("Invalid Todo Priority");
        }
    break;
    case containsStatusAndCategory(request.query):
        if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
            if (category === "WORK" || category === "HOME" || category === "LEARNING") {
                getTodoQuery = `SELECT * FROM todo WHERE 
                status = '${status}' AND category = '${category}';`;
                data = await dataBase.all(getTodoQuery); 
                response.send(data.map((each) => convertToResponseObject(each)));
            } else {
                response.status(400);
                response.send("Invalid Todo Category");
            }
        } else {
            response.status(400);
            response.send("Invalid Todo Status");
        }
    break; 
    case containsStatus(request.query):
        if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
            getTodoQuery = `SELECT * FROM todo WHERE status = '${status}';`;
            data = await dataBase.all(getTodoQuery); 
            response.send(data.map((each) => convertToResponseObject(each)));
        } else {
            response.status(400);
            response.send("Invalid Todo Status");
        }
    break;
    case containsCategory(request.query):
        if (category === "WORK" || category === "HOME" || category === "LEARNING") {
            getTodoQuery = `SELECT * FROM todo WHERE category = '${category}';`;
            data = await dataBase.all(getTodoQuery); 
            response.send(data.map((each) => convertToResponseObject(each)));
        } else {
            response.status(400);
            response.send("Invalid Todo Category");
        }
    break;
    case containsPriority(request.query):
        if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
            getTodoQuery = `SELECT * FROM todo WHERE priority = '${priority}';`;
            data = await dataBase.all(getTodoQuery); 
            response.send(data.map((each) => convertToResponseObject(each)));
        } else {
            response.status(400);
            response.send("Invalid Todo Priority");
        }
    break;
    case containsSearch_q(request.query):
        getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
        data = await dataBase.all(getTodoQuery); 
        response.send(data.map((each) => convertToResponseObject(each)));
    break;
    default: 
        getTodoQuery = `SELECT * FROM todo;`;
        data = await dataBase.get(getTodoQuery); 
        response.send(data.map((each) => convertToResponseObject(each)));        
    break;
    } ;   
}); 




app.get("/todos/:todoId/", async(request, response) => {
    const { todoId } = request.params;
    const getIdTodoQuery = 
    `SELECT * FROM todo WHERE id = ${todoId};`; 

    const getTodo = await dataBase.get(getIdTodoQuery);
    response.send(convertToResponseObject(getTodo));
});

app.get("/agenda/", async(request, response) => { 
    const { date } = request.query;    
    if (dateFns.isMatch(date, "yyyy-MM-dd") === true) {
        const validDateFormat = dateFns.format(new Date(date), "yyyy-MM-dd");
        const getDateTodoQuery = 
       `SELECT * FROM todo WHERE due_date = '${validDateFormat}';`; 
        const dateTodo = await dataBase.all(getDateTodoQuery); 
        response.send(dateTodo.map((each) => convertToResponseObject(each)));
    } else {
        response.status(400);
        response.send("Invalid Due Date");
    };
}); 

app.post("/todos/", async(request, response) => {
    const {id, todo, priority, status, category, dueDate} = request.body;
    if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        if (category === "WORK" || category === "HOME" || category === "LEARNING") {
             if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
                 if (dateFns.isMatch(dueDate, "yyyy-MM-dd")) {
                        const validDateFormat = dateFns.format(new Date(dueDate), "yyyy-MM-dd")
                        const addTodoQuery = 
                            `INSERT INTO todo (id, todo, priority, status, category, due_date)
                            VALUES (${id}, '${todo}','${priority}', '${status}', '${category}', '${validDateFormat}');`;
                        await  dataBase.run(addTodoQuery);
                        response.send("Todo Successfully Added");                                                                       
                    } else {
                        response.status(400);
                        response.send("Invalid Due Date");                     
                    };
                } else {
                    response.status(400);
                    response.send("Invalid Todo Status");                    
                };        
        } else {
            response.status(400);
            response.send("Invalid Todo Category");
        };
    } else {
        response.status(400);
        response.send("Invalid Todo Priority");
    };
});

app.put("/todos/:todoId/", async(request, response) => {
    const { todoId } = request.params;
    const requestBody = request.body;
    const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
    const previousTodo = await dataBase.get(previousTodoQuery); 
    const {
        todo = previousTodo.todo,
        priority = previousTodo.priority,
        status = previousTodo.status,
        category = previousTodo.category,
        dueDate = previousTodo.dueDate
    } = request.body;
    let updateTodoQuery;
    switch (true) {
        case requestBody.status !== undefined:
            if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
                updateTodoQuery = `UPDATE todo SET todo = '${todo}', priority = '${priority}', 
                status = '${status}', category='${category}', due_date='${dueDate}' WHERE id = ${todoId};`;
                await dataBase.run(updateTodoQuery);
                response.send("Status Updated");
            } else {
                response.status(400);
                response.send("Invalid Todo Status")
            };
        break;
        case requestBody.priority !== undefined:
            if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
                updateTodoQuery = `UPDATE todo SET todo = '${todo}', priority = '${priority}', 
                status = '${status}', category='${category}', due_date='${dueDate}' WHERE id = ${todoId};`;
                await dataBase.run(updateTodoQuery);
                response.send("Priority Updated");
            } else {
                response.status(400);
                response.send("Invalid Todo Priority");
            };
        break;
        case requestBody.category !== undefined:
            if (category === "WORK" || category === "HOME" || category === "LEARNING") {
                updateTodoQuery = `UPDATE todo SET todo = '${todo}', priority = '${priority}', 
                status = '${status}', category='${category}', due_date='${dueDate}' WHERE id = ${todoId};`;
                await dataBase.run(updateTodoQuery);
                response.send("Category Updated");
            } else {
                response.status(400);
                response.send("Invalid Todo Category");
            };
        break;
        case requestBody.dueDate !== undefined:
            if (dateFns.isMatch(dueDate, "yyyy-MM-dd")) { 
                const newDate = dateFns.format(new Date(dueDate), "yyyy-MM-dd");              
                updateTodoQuery = `UPDATE todo SET todo = '${todo}', priority = '${priority}', 
                status = '${status}', category='${category}', due_date='${newDate}' WHERE id = ${todoId};`;
                await dataBase.run(updateTodoQuery);
                response.send("Due Date Updated");
            } else {
                response.status(400);
                response.send("Invalid Due Date");
            };
        break;
        case requestBody.todo !== undefined:
            updateTodoQuery = `UPDATE todo SET todo = '${todo}', priority = '${priority}', 
            status = '${status}', category='${category}', due_date='${dueDate}' WHERE id = ${todoId};`;
            await dataBase.run(updateTodoQuery);
            response.send("Todo Updated");
        break;           
        
    };
});

app.delete("/todos/:todoId/", async(request, response) => {
    const { todoId } = request.params;
    const deleteIdTodoQuery = 
    `DELETE FROM todo WHERE id = ${todoId};`;

    await dataBase.run(deleteIdTodoQuery);
    response.send("Todo Deleted");    
}); 

module.exports = app;