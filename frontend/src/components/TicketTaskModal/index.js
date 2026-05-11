import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  makeStyles
} from "@material-ui/core";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  textField: {
    marginRight: theme.spacing(1),
    flex: 1,
  },
}));

const TicketTaskModal = ({ modalOpen, onClose, ticket }) => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState({ title: "", description: "", limitDate: "" });

  useEffect(() => {
    if (modalOpen) {
      setTask({ title: "", description: "", limitDate: "" });
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
    if (!task.title) return;
    setLoading(true);
    try {
      // Ajuste conforme seu endpoint de tarefas
      await api.post("/tasks", {
        ...task,
        ticketId: ticket.id,
        contactId: ticket.contactId
      });
      toast.success("Tarefa criada com sucesso!");
      handleClose();
    } catch (err) {
      toast.error("Erro ao criar tarefa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={modalOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nova Tarefa</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Título"
          name="title"
          value={task.title}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          margin="dense"
          autoFocus
        />
        <TextField
          label="Descrição"
          name="description"
          value={task.description}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          margin="dense"
          multiline
          rows={3}
        />
        <TextField
          label="Data Limite"
          name="limitDate"
          type="datetime-local"
          value={task.limitDate}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary" variant="outlined">
          Cancelar
        </Button>
        <ButtonWithSpinner loading={loading} onClick={handleSave} color="primary" variant="contained">
          Salvar
        </ButtonWithSpinner>
      </DialogActions>
    </Dialog>
  );
};

export default TicketTaskModal;