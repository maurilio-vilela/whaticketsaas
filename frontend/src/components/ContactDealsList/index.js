import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import {
  Button,
  Paper,
  Typography,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Box,
  makeStyles
} from "@material-ui/core";
import {
  Add,
  MoreVert,
  MonetizationOn,
  Edit,
  DeleteOutline,
  TrendingUp,
  AcUnit,
  Whatshot
} from "@material-ui/icons";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import TicketDealModal from "../TicketDealModal";
import ConfirmationModal from "../ConfirmationModal";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
  dealCard: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderLeft: "5px solid #ccc",
    transition: "all 0.3s",
    "&:hover": {
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    }
  },
  dealHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  dealTitle: {
    fontWeight: "bold",
    fontSize: "1rem",
  },
  dealValue: {
    fontSize: "1.1rem",
    fontWeight: "bold",
    color: theme.palette.success.main,
    marginTop: 4,
  },
  statusChip: {
    height: 20,
    fontSize: "0.7rem",
    fontWeight: "bold",
    marginLeft: 8,
  },
  open: { borderLeftColor: "#2196f3" },
  won: { borderLeftColor: "#4caf50" },
  lost: { borderLeftColor: "#f44336" },
  
  // Temperaturas
  cold: { color: "#2196F3" },
  warm: { color: "#FF9800" },
  hot: { color: "#F44336" },
}));

const ContactDealsList = ({ contactId }) => {
  const classes = useStyles();
  
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState(null);
  
  // Menu Actions
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuDealId, setMenuDealId] = useState(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  useEffect(() => {
    if (contactId) {
      fetchDeals();
    }
  }, [contactId]);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/deals", {
        params: { contactId, pageNumber: 1 }
      });
      setDeals(data.deals);
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  const handleOpenDealModal = (dealId) => {
    setSelectedDealId(dealId);
    setDealModalOpen(true);
    handleCloseMenu();
  };

  const handleCloseDealModal = () => {
    setDealModalOpen(false);
    setSelectedDealId(null);
    fetchDeals(); // Recarrega a lista após salvar
  };

  const handleOpenMenu = (event, dealId) => {
    setAnchorEl(event.currentTarget);
    setMenuDealId(dealId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuDealId(null);
  };

  const handleDeleteDeal = async () => {
    try {
      await api.delete(`/deals/${menuDealId}`);
      fetchDeals();
      setConfirmationOpen(false);
      handleCloseMenu();
    } catch (err) {
      toastError(err);
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'won') return <Chip label="Ganho" className={classes.statusChip} style={{backgroundColor: '#e8f5e9', color: '#2e7d32'}} />;
    if (status === 'lost') return <Chip label="Perdido" className={classes.statusChip} style={{backgroundColor: '#ffebee', color: '#c62828'}} />;
    return <Chip label="Aberto" className={classes.statusChip} style={{backgroundColor: '#e3f2fd', color: '#1565c0'}} />;
  };

  const getTemperatureIcon = (temp) => {
    if (temp === 'hot') return <Whatshot className={classes.hot} fontSize="small" />;
    if (temp === 'warm') return <TrendingUp className={classes.warm} fontSize="small" />;
    return <AcUnit className={classes.cold} fontSize="small" />;
  };

  return (
    <div className={classes.root}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" color="textSecondary">
          Oportunidades ({deals.length})
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />}
          onClick={() => handleOpenDealModal(null)}
        >
          Nova Oportunidade
        </Button>
      </Box>

      {/* MODAIS */}
      <TicketDealModal 
        modalOpen={dealModalOpen} 
        onClose={handleCloseDealModal} 
        dealId={selectedDealId}
        // Passamos um objeto mockado de ticket apenas com o contactId para o modal funcionar
        ticket={{ contactId: contactId }} 
      />

      <ConfirmationModal
        title="Excluir Oportunidade?"
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        onConfirm={handleDeleteDeal}
      >
        Tem certeza que deseja excluir esta oportunidade? Essa ação não pode ser desfeita.
      </ConfirmationModal>

      {/* MENU DE AÇÕES */}
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleOpenDealModal(menuDealId)}>
          <Edit fontSize="small" style={{marginRight: 10}} /> Editar
        </MenuItem>
        <MenuItem onClick={() => setConfirmationOpen(true)}>
          <DeleteOutline fontSize="small" style={{marginRight: 10, color: 'red'}} /> Excluir
        </MenuItem>
      </Menu>

      {/* LISTA */}
      <Grid container spacing={2}>
        {deals.length > 0 ? (
          deals.map((deal) => (
            <Grid item xs={12} key={deal.id}>
              <Paper 
                elevation={1} 
                className={`${classes.dealCard} ${classes[deal.status]}`}
              >
                <div className={classes.dealHeader}>
                  <Box>
                    <Typography className={classes.dealTitle}>
                      {deal.name}
                      {getStatusLabel(deal.status)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" style={{display: 'flex', alignItems: 'center', gap: 5, marginTop: 4}}>
                      Etapa: {deal.stage?.name || "Sem Etapa"} • {format(parseISO(deal.updatedAt), "dd/MM/yyyy HH:mm")}
                      • {getTemperatureIcon(deal.temperature)}
                    </Typography>
                    
                    <Typography className={classes.dealValue}>
                      R$ {parseFloat(deal.totalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={(e) => handleOpenMenu(e, deal.id)}>
                    <MoreVert />
                  </IconButton>
                </div>
              </Paper>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={5}>
              <MonetizationOn style={{ fontSize: 50, color: "#e0e0e0" }} />
              <Typography color="textSecondary" style={{marginTop: 10}}>
                Nenhuma oportunidade encontrada.
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </div>
  );
};

export default ContactDealsList;