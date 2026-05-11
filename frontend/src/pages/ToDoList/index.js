import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Card, Form, Button, Container, Row, Col, InputGroup } from "react-bootstrap";
import { BiTask, BiText, BiCalendar, BiUser, BiFlag } from "react-icons/bi";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import api from "../../services/api";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { SocketManager } from "../../context/Socket/SocketContext";
import moment from "moment";
import "moment/locale/pt-br";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "bootstrap/dist/css/bootstrap.min.css"; // Importe o CSS do Bootstrap
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

moment.locale("pt-br");

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  listContainer: {
    width: "100%",
    height: "100%",
    marginTop: theme.spacing(1),
    backgroundColor: "#f5f5f5",
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
  },
  list: {
    marginBottom: theme.spacing(2),
  },
  kanbanContainer: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    marginTop: theme.spacing(2),
  },
  kanbanColumn: {
    width: "32%",
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    minHeight: "200px",
  },
  kanbanTodo: {
    backgroundColor: "#fed700",
  },
  kanbanDoing: {
    backgroundColor: "#ef7b00",
  },
  kanbanDone: {
    backgroundColor: "#00bfa5",
  },
  calendarContainer: {
    width: "100%",
    height: "60vh",
    marginTop: theme.spacing(2),
  },
  priorityHigh: {
    backgroundColor: "#ff4444",
    color: theme.palette.common.white,
    padding: theme.spacing(0.5, 2),
    borderRadius: theme.shape.borderRadius,
  },
  priorityMedium: {
    backgroundColor: "#ffbb33",
    color: theme.palette.common.black,
    padding: theme.spacing(0.5, 2),
    borderRadius: theme.shape.borderRadius,
  },
  priorityLow: {
    backgroundColor: "#00C851",
    color: theme.palette.common.white,
    padding: theme.spacing(0.5, 2),
    borderRadius: theme.shape.borderRadius,
  },
  accordionSection: {
    marginBottom: theme.spacing(4),
  },
  accordionActions: {
    display: "flex",
    justifyContent: "flex-end",
    width: "100%",
  },
  kanbanCard: {
    backgroundColor: theme.palette.common.white,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderRadius: 6, // Ajustado para corresponder ao rounded-2 (aproximadamente 6px)
    boxShadow: theme.shadows[2],
  },
  kanbanActions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: theme.spacing(1),
    gap: theme.spacing(0.5),
  },
  modal: {
    "& .MuiDialog-paper": {
      width: "50vw",
      maxWidth: "none",
    },
  },
}));

const localizer = momentLocalizer(moment);

const ToDoList = () => {
  const classes = useStyles();

  const [task, setTask] = useState({
    text: "",
    description: "",
    dueDate: "",
    priority: "Prioridade",
    assignedUserId: "",
  });
  const [companyUsers, setCompanyUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [editId, setEditId] = useState(null);
  const [viewMode, setViewMode] = useState("accordion");
  const [calendarView, setCalendarView] = useState("day");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    if (!companyId) {
      console.error("CompanyId não encontrado no localStorage");
      setNotification({
        open: true,
        message: "Erro: CompanyId não encontrado. Faça login novamente.",
        severity: "error",
      });
      return;
    }

    const socket = SocketManager.getSocket(companyId);

    socket.on(`company-${companyId}-task`, (data) => {
      console.log("Evento WebSocket recebido:", data);
      fetchTasks();
      switch (data.action) {
        case "create":
          setNotification({
            open: true,
            message: `Tarefa "${data.task.text}" criada!`,
            severity: "success",
          });
          break;
        case "update":
          setNotification({
            open: true,
            message: `Tarefa "${data.task.text}" atualizada!`,
            severity: "info",
          });
          break;
        case "delete":
          setNotification({
            open: true,
            message: `Tarefa excluída!`,
            severity: "warning",
          });
          break;
        default:
          break;
      }
    });

    fetchTasks();
    fetchCompanyUsers();

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get("/tasks");
      console.log("Resposta GET /tasks:", response.data);
      setTasks(response.data.tasks || []);
      checkNotifications(response.data.tasks || []);
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error.response?.data || error.message);
      setNotification({
        open: true,
        message: `Erro ao carregar tarefas: ${error.response?.data?.error || "Erro interno"}`,
        severity: "error",
      });
    }
  };

  const fetchCompanyUsers = async () => {
    try {
      const companyId = localStorage.getItem("companyId");
      if (!companyId || isNaN(parseInt(companyId))) {
        throw new Error("Invalid companyId in localStorage");
      }
      const response = await api.get("/users", {
        params: { companyId: parseInt(companyId) },
      });
      console.log("Resposta GET /users:", response.data);
      setCompanyUsers(response.data.users || []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error.response?.data || error.message);
      setNotification({
        open: true,
        message: `Erro ao carregar usuários: ${error.response?.data?.error || error.message}`,
        severity: "error",
      });
    }
  };

  const checkNotifications = (tasksList) => {
    const now = new Date();
    tasksList.forEach((t) => {
      if (!t.completed && new Date(t.dueDate) <= now) {
        setNotification({
          open: true,
          message: `Tarefa atrasada: ${t.text}`,
          severity: "warning",
        });
      }
    });
  };

  const handleAddTask = async () => {
    if (!task.text.trim() || !task.dueDate) {
      setNotification({
        open: true,
        message: "Preencha todos os campos obrigatórios!",
        severity: "error",
      });
      return;
    }

    const taskData = {
      text: task.text,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      completed: false,
      status: "todo",
      assignedUserId: task.assignedUserId || null,
    };

    console.log("Dados enviados:", taskData);

    try {
      if (editId) {
        const response = await api.put(`/tasks/${editId}`, taskData);
        console.log("Resposta PUT:", response.data);
        // Fecha o modal de edição após uma atualização bem-sucedida
        setEditModalOpen(false);
        setTask({ text: "", description: "", dueDate: "", priority: "Prioridade", assignedUserId: "" });
        setEditId(null);
      } else {
        const response = await api.post("/tasks", taskData);
        console.log("Resposta POST:", response.data);
        setTask({ text: "", description: "", dueDate: "", priority: "Prioridade", assignedUserId: "" });
        setEditId(null);
      }
      fetchTasks();
      setNotification({
        open: true,
        message: editId ? "Tarefa atualizada com sucesso!" : "Tarefa criada com sucesso!",
        severity: "success",
      });
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error.response?.data || error.message);
      setNotification({
        open: true,
        message: `Erro ao salvar tarefa: ${error.response?.data?.error || "Erro interno"}`,
        severity: "error",
      });
    }
  };

  const handleEditTask = (taskToEdit) => {
    setTask({
      text: taskToEdit.text,
      description: taskToEdit.description || "",
      dueDate: moment(taskToEdit.dueDate).format("YYYY-MM-DDTHH:mm"),
      priority: taskToEdit.priority,
      assignedUserId: taskToEdit.assignedUserId || "",
    });
    setEditId(taskToEdit.id);
    setEditModalOpen(true);
  };

  const handleDeleteTask = (id) => {
    setTaskToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const response = await api.delete(`/tasks/${taskToDelete}`);
      console.log("Resposta DELETE:", response.data);
      setNotification({
        open: true,
        message: "Tarefa excluída com sucesso!",
        severity: "success",
      });
      fetchTasks();
    } catch (error) {
      console.error("Erro ao deletar tarefa:", error.response?.data || error.message);
      setNotification({
        open: true,
        message: `Erro ao deletar tarefa: ${error.response?.data?.error || "Erro interno"}`,
        severity: "error",
      });
    } finally {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const handleCompleteTask = async (id) => {
    try {
      const response = await api.put(`/tasks/${id}`, {
        completed: true,
        status: "done",
        updatedAt: new Date(),
      });
      console.log("Resposta PUT (complete):", response.data);
      fetchTasks();
    } catch (error) {
      console.error("Erro ao completar tarefa:", error.response?.data || error.message);
      setNotification({
        open: true,
        message: `Erro ao completar tarefa: ${error.response?.data?.error || "Erro interno"}`,
        severity: "error",
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setTask({ text: "", description: "", dueDate: "", priority: "Prioridade", assignedUserId: "" });
    setEditId(null);
  };

  const formatDatePtBR = (date) => {
    return moment(date).format("DD/MM/YYYY HH:mm");
  };

  const sortByDate = (taskList) => {
    return taskList.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "High":
        return classes.priorityHigh;
      case "Medium":
        return classes.priorityMedium;
      case "Low":
        return classes.priorityLow;
      default:
        return "";
    }
  };

  const truncateDescription = (description, maxLength = 50) => {
    if (!description) return "";
    return description.length > maxLength ? `${description.slice(0, maxLength)}...` : description;
  };

  const today = moment().startOf("day");
  const endOfWeek = moment().endOf("week");
  const endOfMonth = moment().endOf("month");

  const todayTasks = tasks.filter((task) => moment(task.dueDate).isSame(today, "day"));
  const weekTasks = tasks.filter(
    (task) => moment(task.dueDate).isBetween(today, endOfWeek, undefined, "[]") && !moment(task.dueDate).isSame(today, "day")
  );
  const monthTasks = tasks.filter(
    (task) => moment(task.dueDate).isAfter(endOfWeek) && moment(task.dueDate).isBefore(endOfMonth, "day")
  );

  const renderAccordionView = () => (
    <div className={classes.listContainer}>
      <div className={classes.accordionSection}>
        <Typography variant="h6">Tarefas de Hoje</Typography>
        <List>
          {sortByDate(todayTasks).map((task) => (
            <ListItem key={task.id}>
              <Accordion style={{ width: "100%" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    {task.text} - <span className={getPriorityClass(task.priority)}>{task.priority}</span> -{" "}
                    {formatDatePtBR(task.dueDate)}
                    {task.assignedUser ? ` (Atribuído a: ${task.assignedUser.name})` : ""}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <div style={{ width: "100%" }}>
                    <Typography variant="body2" paragraph>
                      {task.description || "Sem descrição"}
                    </Typography>
                    <div className={classes.accordionActions}>
                      <IconButton onClick={() => handleEditTask(task)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleCompleteTask(task.id)}>
                        <CheckCircleIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteTask(task.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </div>
                  </div>
                </AccordionDetails>
              </Accordion>
            </ListItem>
          ))}
        </List>
      </div>
      <div className={classes.accordionSection}>
        <Typography variant="h6">Tarefas da Semana</Typography>
        <List>
          {sortByDate(weekTasks).map((task) => (
            <ListItem key={task.id}>
              <Accordion style={{ width: "100%" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    {task.text} - <span className={getPriorityClass(task.priority)}>{task.priority}</span> -{" "}
                    {formatDatePtBR(task.dueDate)}
                    {task.assignedUser ? ` (Atribuído a: ${task.assignedUser.name})` : ""}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <div style={{ width: "100%" }}>
                    <Typography variant="body2" paragraph>
                      {task.description || "Sem descrição"}
                    </Typography>
                    <div className={classes.accordionActions}>
                      <IconButton onClick={() => handleEditTask(task)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleCompleteTask(task.id)}>
                        <CheckCircleIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteTask(task.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </div>
                  </div>
                </AccordionDetails>
              </Accordion>
            </ListItem>
          ))}
        </List>
      </div>
      <div className={classes.accordionSection}>
        <Typography variant="h6">Tarefas do Mês</Typography>
        <List>
          {sortByDate(monthTasks).map((task) => (
            <ListItem key={task.id}>
              <Accordion style={{ width: "100%" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    {task.text} - <span className={getPriorityClass(task.priority)}>{task.priority}</span> -{" "}
                    {formatDatePtBR(task.dueDate)}
                    {task.assignedUser ? ` (Atribuído a: ${task.assignedUser.name})` : ""}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <div style={{ width: "100%" }}>
                    <Typography variant="body2" paragraph>
                      {task.description || "Sem descrição"}
                    </Typography>
                    <div className={classes.accordionActions}>
                      <IconButton onClick={() => handleEditTask(task)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleCompleteTask(task.id)}>
                        <CheckCircleIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteTask(task.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </div>
                  </div>
                </AccordionDetails>
              </Accordion>
            </ListItem>
          ))}
        </List>
      </div>
    </div>
  );

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const newTasks = Array.from(tasks);
    const [movedTask] = newTasks.splice(source.index, 1);
    const newStatus = destination.droppableId;

    movedTask.status = newStatus;
    newTasks.splice(destination.index, 0, movedTask);

    setTasks(newTasks);

    try {
      await api.put(`/tasks/${movedTask.id}`, { status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error("Erro ao atualizar status da tarefa:", error.response?.data || error.message);
      setNotification({
        open: true,
        message: `Erro ao atualizar status: ${error.response?.data?.error || "Erro interno"}`,
        severity: "error",
      });
    }
  };

  const renderKanbanView = () => (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className={classes.kanbanContainer}>
        {["todo", "doing", "done"].map((status) => (
          <Droppable droppableId={status} key={status}>
            {(provided) => (
              <div
                className={`${classes.kanbanColumn} ${
                  status === "todo"
                    ? classes.kanbanTodo
                    : status === "doing"
                    ? classes.kanbanDoing
                    : classes.kanbanDone
                }`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <Typography variant="h6">{status.toUpperCase()}</Typography>
                <List>
                  {tasks.filter((task) => task.status === status).map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={classes.kanbanCard}
                        >
                          <div style={{ width: "100%" }}>
                            <ListItemText
                              primary={task.text}
                              primaryTypographyProps={{ variant: "h6" }}
                              style={{ marginBottom: "8px" }}
                            />
                            <Typography variant="body2" color="textSecondary" paragraph>
                              {truncateDescription(task.description) || "Sem descrição"}
                            </Typography>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "8px" }}>
                            <div>
                              <Typography variant="body2" color="textSecondary">
                                <span className={getPriorityClass(task.priority)}>{task.priority}</span>
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {formatDatePtBR(task.dueDate)}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Atribuído a: {task.assignedUser ? task.assignedUser.name : "Ninguém"}
                              </Typography>
                            </div>
                            <div className={classes.kanbanActions}>
                              <IconButton onClick={() => handleEditTask(task)} size="small">
                                <EditIcon />
                              </IconButton>
                              {status !== "done" && (
                                <IconButton onClick={() => handleCompleteTask(task.id)} size="small">
                                  <CheckCircleIcon />
                                </IconButton>
                              )}
                              <IconButton onClick={() => handleDeleteTask(task.id)} size="small">
                                <DeleteIcon />
                              </IconButton>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </List>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );

  const handleCalendarDrop = async ({ event, start }) => {
    console.log("Evento de drop disparado:", { event, start });
    const task = tasks.find((t) => t.id === event.id);
    if (!task) {
      console.error("Tarefa não encontrada para o evento:", event);
      return;
    }

    const now = moment();
    let newStatus;
    if (moment(start).isBefore(now, "day")) {
      newStatus = "done";
    } else if (moment(start).isSame(now, "day")) {
      newStatus = "todo";
    } else {
      newStatus = "doing";
    }

    try {
      await api.put(`/tasks/${task.id}`, {
        dueDate: start.toISOString(),
        status: newStatus,
      });
      console.log("Tarefa atualizada no calendário:", { id: task.id, dueDate: start, status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error("Erro ao atualizar tarefa no calendário:", error.response?.data || error.message);
      setNotification({
        open: true,
        message: `Erro ao atualizar tarefa: ${error.response?.data?.error || "Erro interno"}`,
        severity: "error",
      });
    }
  };

  const renderCalendarView = () => (
    <div className={classes.calendarContainer}>
      <Calendar
        localizer={localizer}
        events={tasks.map((task) => ({
          id: task.id,
          title: `${task.text} (${task.priority})${task.assignedUser ? ` - ${task.assignedUser.name}` : ""}`,
          start: new Date(task.dueDate),
          end: new Date(task.dueDate),
          allDay: false,
        }))}
        startAccessor="start"
        endAccessor="end"
        view={calendarView}
        views={["month", "week", "day"]}
        onView={(view) => setCalendarView(view)}
        onSelectEvent={(event) => handleEditTask(tasks.find((t) => t.id === event.id))}
        onEventDrop={handleCalendarDrop}
        draggableAccessor={() => true}
        step={30} // Intervalo de 30 minutos
        timeslots={2} // 2 slots por intervalo (30min cada)
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: event.title.includes("High")
              ? "#ff4444"
              : event.title.includes("Medium")
              ? "#ffbb33"
              : "#00C851",
            color: event.title.includes("Medium") ? "#000" : "#fff",
            cursor: "grab",
            border: "1px solid #ccc",
            padding: "4px",
            fontSize: "14px",
            minHeight: "20px",
          },
        })}
        messages={{
          today: "Hoje",
          previous: "Anterior",
          next: "Próximo",
          month: "Mês",
          week: "Semana",
          day: "Dia",
        }}
        popup
        selectable
      />
    </div>
  );

  return (
    <div className={classes.root}>
      <Container fluid className="w-100 h-100 p-0">
        <Row className="w-100 p-4">
          <Col md={12} className="p-0" style={{ marginRight: "1rem" }}>
            <Card className="p-3 shadow-sm bg-light border border-light-subtle rounded w-100 h-100">
              <Card.Body className="p-0">
                <Form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddTask();
                  }}
                >
                  <Row className="g-2 align-items-center">
                    <Col md={6}>
                      {/* Nome da Tarefa */}
                      <Form.Group controlId="taskName" className="mb-2">
                        <InputGroup className="border border-1 border-light-subtle bg-white rounded-2">
                          <InputGroup.Text className="bg-white border-0 rounded-start-2">
                            <BiTask className="text-muted" />
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="Nome da tarefa"
                            name="text"
                            value={task.text}
                            onChange={(e) =>
                              setTask({ ...task, text: e.target.value })
                            }
                            className="bg-white border-0 focus-border-warning rounded-end-2"
                            required
                          />
                        </InputGroup>
                      </Form.Group>

                      {/* Descrição */}
                      <Form.Group controlId="taskDescription" className="mb-2">
                        <InputGroup className="border border-1 border-light-subtle bg-white rounded-2">
                          <InputGroup.Text className="bg-white border-0 rounded-start-2">
                            <BiText className="text-muted" />
                          </InputGroup.Text>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Descrição"
                            name="description"
                            value={task.description}
                            onChange={(e) =>
                              setTask({ ...task, description: e.target.value })
                            }
                            className="bg-white border-0 focus-border-warning rounded-end-2"
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Row className="g-2 align-items-center">
                        {/* Data de Vencimento */}
                        <Col md={6}>
                          <Form.Group controlId="dueDate" className="mb-2">
                            <InputGroup className="border border-1 border-light-subtle bg-white rounded-2">
                              <InputGroup.Text className="bg-white border-0 rounded-start-2">
                                <BiCalendar className="text-muted" />
                              </InputGroup.Text>
                              <Form.Control
                                type="datetime-local"
                                name="dueDate"
                                value={task.dueDate}
                                onChange={(e) =>
                                  setTask({ ...task, dueDate: e.target.value })
                                }
                                className="bg-white border-0 focus-border-warning rounded-end-2"
                                required
                              />
                            </InputGroup>
                          </Form.Group>
                        </Col>

                        {/* Prioridade */}
                        <Col md={6}>
                          <Form.Group controlId="priority" className="mb-2">
                            <InputGroup className="border border-1 border-light-subtle bg-white rounded-2">
                              <InputGroup.Text className="bg-white border-0 rounded-start-2">
                                <BiFlag className="text-muted" />
                              </InputGroup.Text>
                              <Form.Select
                                name="priority"
                                value={task.priority}
                                onChange={(e) =>
                                  setTask({ ...task, priority: e.target.value })
                                }
                                className="bg-white border-0 focus-border-warning rounded-end-2"
                              >
                                <option value="">Prioridade</option>
                                <option value="High">Alta</option>
                                <option value="Medium">Média</option>
                                <option value="Low">Baixa</option>
                              </Form.Select>
                            </InputGroup>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row className="g-2 align-items-center">
                        {/* Responsável */}
                        <Col md={6}>
                          <Form.Group controlId="responsible" className="mb-2">
                            <InputGroup className="border border-1 border-light-subtle bg-white rounded-2">
                              <InputGroup.Text className="bg-white border-0 rounded-start-2">
                                <BiUser className="text-muted" />
                              </InputGroup.Text>
                              <Form.Select
                                name="assignedUserId"
                                value={task.assignedUserId}
                                onChange={(e) =>
                                  setTask({ ...task, assignedUserId: e.target.value })
                                }
                                className="bg-white border-0 focus-border-warning rounded-end-2"
                              >
                                <option value="">Responsável</option>
                                {companyUsers.map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.name}
                                  </option>
                                ))}
                              </Form.Select>
                            </InputGroup>
                          </Form.Group>
                        </Col>
                        <Col md={6} className="d-flex justify-content-end">
                          {/* Botão Adicionar */}
                          <Button
                            type="submit"
                            variant="success"
                            className="text-white align-self-start rounded-2"
                          >
                            {editId ? "Salvar" : "Adicionar Tarefa"}
                          </Button>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} className="p-2 d-flex flex-column justify-content-start align-items-start">
            <div>
              <Button
                variant="outline-secondary"
                onClick={() => setViewMode("accordion")}
                className="me-2 mb-0 rounded-2"
              >
                Lista Sanfonada
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => setViewMode("kanban")}
                className="me-2 mb-0 rounded-2"
              >
                Kanban
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => setViewMode("calendar")}
                className="mb-0 rounded-2"
              >
                Calendário
              </Button>
            </div>
          </Col>
        </Row>
        <div className={classes.listContainer}>
          {viewMode === "accordion" && renderAccordionView()}
          {viewMode === "kanban" && renderKanbanView()}
          {viewMode === "calendar" && renderCalendarView()}
        </div>
      </Container>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        className={classes.modal}
      >
        <DialogTitle id="alert-dialog-title">Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Tem certeza que deseja excluir esta tarefa? Essa ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} variant="primary" className="rounded-2">
            Cancelar
          </Button>
          <Button onClick={confirmDeleteTask} variant="danger" autoFocus className="rounded-2">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={editModalOpen}
        onClose={handleCloseEditModal}
        className={classes.modal}
        aria-labelledby="edit-task-modal-title"
      >
        <DialogTitle id="edit-task-modal-title">Editar Tarefa</DialogTitle>
        <DialogContent>
          <Card className="p-3 shadow-sm bg-light border border-light-subtle rounded">
            <Card.Body className="p-0">
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddTask();
                }}
              >
                <Row className="g-2 align-items-center">
                  <Col md={12}>
                    {/* Nome da Tarefa */}
                    <Form.Group controlId="editTaskName" className="mb-2">
                      <InputGroup className="border border-1 border-light-subtle bg-white rounded-2">
                        <InputGroup.Text className="bg-white border-0 rounded-start-2">
                          <BiTask className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Nome da tarefa"
                          name="text"
                          value={task.text}
                          onChange={(e) =>
                            setTask({ ...task, text: e.target.value })
                          }
                          className="bg-white border-0 focus-border-warning rounded-end-2"
                          required
                        />
                      </InputGroup>
                    </Form.Group>

                    {/* Descrição */}
                    <Form.Group controlId="editTaskDescription" className="mb-2">
                      <InputGroup className="border border-1 border-light-subtle bg-white rounded-2">
                        <InputGroup.Text className="bg-white border-0 rounded-start-2">
                          <BiText className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          placeholder="Descrição"
                          name="description"
                          value={task.description}
                          onChange={(e) =>
                            setTask({ ...task, description: e.target.value })
                          }
                          className="bg-white border-0 focus-border-warning rounded-end-2"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Row className="g-2 align-items-center">
                      {/* Data de Vencimento */}
                      <Col md={6}>
                        <Form.Group controlId="editDueDate" className="mb-2">
                          <InputGroup className="border border-1 border-light-subtle bg-white rounded-2">
                            <InputGroup.Text className="bg-white border-0 rounded-start-2">
                              <BiCalendar className="text-muted" />
                            </InputGroup.Text>
                            <Form.Control
                              type="datetime-local"
                              name="dueDate"
                              value={task.dueDate}
                              onChange={(e) =>
                                setTask({ ...task, dueDate: e.target.value })
                              }
                              className="bg-white border-0 focus-border-warning rounded-end-2"
                              required
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>

                      {/* Prioridade */}
                      <Col md={6}>
                        <Form.Group controlId="editPriority" className="mb-2">
                          <InputGroup className="border border-1 border-light-subtle bg-white rounded-2">
                            <InputGroup.Text className="bg-white border-0 rounded-start-2">
                              <BiFlag className="text-muted" />
                            </InputGroup.Text>
                            <Form.Select
                              name="priority"
                              value={task.priority}
                              onChange={(e) =>
                                setTask({ ...task, priority: e.target.value })
                              }
                              className="bg-white border-0 focus-border-warning rounded-end-2"
                            >
                              <option value="">Prioridade</option>
                              <option value="High">Alta</option>
                              <option value="Medium">Média</option>
                              <option value="Low">Baixa</option>
                            </Form.Select>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="g-2 align-items-center">
                      {/* Responsável */}
                      <Col md={6}>
                        <Form.Group controlId="editResponsible" className="mb-2">
                          <InputGroup className="border border-1 border-light-subtle bg-white rounded-2">
                            <InputGroup.Text className="bg-white border-0 rounded-start-2">
                              <BiUser className="text-muted" />
                            </InputGroup.Text>
                            <Form.Select
                              name="assignedUserId"
                              value={task.assignedUserId}
                              onChange={(e) =>
                                setTask({ ...task, assignedUserId: e.target.value })
                              }
                              className="bg-white border-0 focus-border-warning rounded-end-2"
                            >
                              <option value="">Responsável</option>
                              {companyUsers.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.name}
                                </option>
                              ))}
                            </Form.Select>
                          </InputGroup>
                        </Form.Group>
                      </Col>

                      <Col md={6} className="d-flex justify-content-end">
                        {/* Botão Salvar no Modal */}
                        <Button
                          type="submit"
                          variant="success"
                          className="text-white align-self-start rounded-2"
                        >
                          Salvar
                        </Button>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal} variant="danger" className="rounded-2">
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ToDoList;