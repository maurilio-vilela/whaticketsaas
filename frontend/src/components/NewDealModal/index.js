import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    InputAdornment,
    Select,
    FormControl,
    InputLabel,
    Tabs,
    Tab,
    Grid,
    MenuItem,
    useTheme,
} from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";

const currencyMask = (value) => {
    if (!value) return "";
    let v = value.replace(/\D/g, "");
    v = (v / 100).toFixed(2) + "";
    v = v.replace(".", ",");
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    return v;
};

const NewDealModal = ({
    open,
    onClose,
    isMobile,
    classes,
    contacts,
    fetchContacts,
    tags,
    newDealData,
    setNewDealData,
    handleCreateNewDeal,
}) => {
    const theme = useTheme();
    const [tabValue, setTabValue] = useState(0);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            classes={{ paper: classes?.modalPaper }}
            fullScreen={isMobile}
        >
            <DialogTitle style={{ backgroundColor: theme.palette.primary.main, color: "#fff" }}>
                Adicionar Oportunidade
            </DialogTitle>
            <DialogContent style={{ paddingTop: 0 }}>
                <Tabs
                    value={tabValue}
                    onChange={(e, v) => setTabValue(v)}
                    indicatorColor="primary"
                    textColor="primary"
                    className={classes?.tabHeader}
                    variant={isMobile ? "fullWidth" : "standard"}
                >
                    <Tab label="Dados Gerais" />
                    <Tab label="Info Adicional" />
                </Tabs>
                {tabValue === 0 && (
                    <Grid container spacing={2} style={{ marginTop: 10 }}>
                        <Grid item xs={12}>
                            <Autocomplete
                                fullWidth
                                options={contacts}
                                loading={contacts.length === 0}
                                getOptionLabel={(option) => option.name}
                                onChange={(e, value) => setNewDealData({ ...newDealData, contactId: value?.id })}
                                onInputChange={(e, v) => fetchContacts(v)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Contato" variant="outlined" required />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl variant="outlined" fullWidth>
                                <InputLabel>Etapa do Funil</InputLabel>
                                <Select
                                    label="Etapa do Funil"
                                    value={newDealData.laneId}
                                    onChange={(e) => setNewDealData({ ...newDealData, laneId: e.target.value })}
                                >
                                    {tags.map((t) => (
                                        <MenuItem key={t.id} value={t.id}>
                                            {t.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Valor da Oportunidade"
                                variant="outlined"
                                value={newDealData.value}
                                onChange={(e) =>
                                    setNewDealData({ ...newDealData, value: currencyMask(e.target.value) })
                                }
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Título / Produto"
                                variant="outlined"
                                placeholder="Ex: Consultoria de Vendas"
                                value={newDealData.title}
                                onChange={(e) => setNewDealData({ ...newDealData, title: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                )}
                {tabValue === 1 && (
                    <Grid container spacing={2} style={{ marginTop: 10 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Anotações / Descrição"
                                variant="outlined"
                                multiline
                                rows={4}
                                value={newDealData.notes}
                                onChange={(e) => setNewDealData({ ...newDealData, notes: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Campo Personalizado 1" variant="outlined" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Campo Personalizado 2" variant="outlined" />
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
            <DialogActions style={{ padding: "20px" }}>
                <Button onClick={onClose} color="secondary" style={{ marginRight: 10 }}>
                    Cancelar
                </Button>
                <Button onClick={handleCreateNewDeal} color="primary" variant="contained" size="large">
                    Salvar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default NewDealModal;