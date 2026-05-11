import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  makeStyles,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from "@material-ui/core";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  textField: {
    marginRight: theme.spacing(1),
    flex: 1,
  },
  formControl: {
    width: "100%",
  }
}));

const TicketTaskModal = ({ modalOpen, onClose, ticket }) => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  
  // Adaptado para bater exatamente com a tabela/interface "Tasks" do backend
  const [task, setTask] = useState({ 
      text: "", 
      description: "", 
      dueDate: "",
      priority: "Medium" 
  });

  useEffect(() => {
    if (modalOpen) {
      setTask({ 
          text: "", 
          description: "", 
          dueDate: "",
          priority: "Medium" 
      });
    }
  }, [modalOpen]);

  const handleClose = () => {
    onClose();
    setLoading(false);
  };

  const handleChange = (e) => {
    setTask({ ...task, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!task.text || !task.dueDate) {
        toast.error("Título (texto) e data limite são obrigatórios!");
        return;
    }
    setLoading(true);
    try {
      // POST para o backend do Todolist
      await api.post("/tasks", {
        text: task.text,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        ticketId: ticket.id,
        contactId: ticket?.contact?.id || ticket?.contactId,
        assignedUserId: user?.id
      });
      toast.success("Tarefa criada e vinculada ao Ticket!");
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar a tarefa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={modalOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Adicionar Tarefa ao Ticket</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <TextField
                label="O que precisa ser feito? (Título)"
                name="text"
                value={task.text}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                autoFocus
                required
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField
                label="Data Limite"
                name="dueDate"
                type="datetime-local"
                value={task.dueDate}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <FormControl variant="outlined" className={classes.formControl}>
                    <InputLabel>Prioridade</InputLabel>
                    <Select
                        name="priority"
                        value={task.priority}
                        onChange={handleChange}
                        label="Prioridade"
                    >
                        <MenuItem value="Low">Baixa</MenuItem>
                        <MenuItem value="Medium">Média</MenuItem>
                        <MenuItem value="High">Alta</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12}>
                <TextField
                label="Descrição / Detalhes"
                name="description"
                value={task.description}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                multiline
                rows={3}
                />
            </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary" variant="outlined">
          Cancelar
        </Button>
        <ButtonWithSpinner loading={loading} onClick={handleSave} color="primary" variant="contained">
          Salvar Tarefa
        </ButtonWithSpinner>
      </DialogActions>
    </Dialog>
  );
};

export default TicketTaskModal;
