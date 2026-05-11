import React, { useState, useContext } from "react";
import PropTypes from "prop-types";
import { makeStyles, Menu, MenuItem, IconButton, Popover, Grid } from "@material-ui/core";
import { 
    Reply as ReplyIcon, 
    Edit as EditIcon, 
    DeleteOutline as DeleteIcon, 
    Forward as ForwardIcon,
    AddCircleOutline as AddIcon
} from '@material-ui/icons';

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ConfirmationModal from "../ConfirmationModal";
import EditMessageModal from "../EditMessageModal";
// import ForwardModal from "../ForwardModal"; // COMENTADO: Componente não existe no projeto ainda
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { ForwardMessageContext } from "../../context/ForwarMessage/ForwardMessageContext";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";

const useStyles = makeStyles((theme) => ({
    reactionPopover: {
        borderRadius: "50px", // Cápsula
        padding: "4px 8px",
        backgroundColor: theme.palette.background.paper,
        boxShadow: "0 5px 15px rgba(0,0,0,0.15)",
    },
    reactionButton: {
        padding: 8,
        fontSize: "1.5rem",
        transition: "transform 0.1s",
        "&:hover": {
            transform: "scale(1.2)",
            backgroundColor: "transparent",
        }
    },
    menuItemIcon: {
        marginRight: 10,
        color: theme.palette.text.secondary,
    },
    gridContainer: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center"
    },
    hideScrollbar: {
        overflow: "hidden"
    },
    popoverContent: {
        padding: theme.spacing(2),
        maxWidth: 400
    },
    iconButton: {
        padding: 8
    }
}));

const MessageOptionsMenu = ({ message, menuOpen, handleClose, anchorEl }) => {
    const classes = useStyles();
    const { setReplyingMessage } = useContext(ReplyMessageContext);
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [confirmationEditOpen, setEditMessageOpenModal] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [messageEdit, setMessageEdit] = useState(false);
    const [reactionAnchorEl, setReactionAnchorEl] = useState(null);
    const [moreAnchorEl, setMoreAnchorEl] = useState(null);
    const {
        showSelectMessageCheckbox,
        setShowSelectMessageCheckbox,
        // eslint-disable-next-line no-unused-vars
        selectedMessages,
        // eslint-disable-next-line no-unused-vars
        forwardMessageModalOpen,
        // eslint-disable-next-line no-unused-vars
        setForwardMessageModalOpen } = useContext(ForwardMessageContext);
        

    const handleDeleteMessage = async () => {
        try {
            await api.delete(`/messages/${message.id}`);
        } catch (err) {
            toastError(err);
        }
    };

    const openReactionsMenu = (event) => {
        setReactionAnchorEl(event.currentTarget);
        handleClose();
    };
    
    const closeReactionsMenu = () => {
        setReactionAnchorEl(null);
        handleClose();
    };

    const openMoreReactionsMenu = (event) => {
        setMoreAnchorEl(event.currentTarget);
        closeReactionsMenu();
    };

    const closeMoreReactionsMenu = () => {
        setMoreAnchorEl(null);
    };

    const handleReactToMessage = async (reactionType) => {
        try {
            await api.post(`/messages/${message.id}/reactions`, { type: reactionType });
            toast.success(i18n.t("messageOptionsMenu.reactionSuccess"));
        } catch (err) {
            toastError(err);
        }
        handleClose();
        closeMoreReactionsMenu();
    };

    const availableReactions = [
        '😀', '😂', '❤️', '👍', '🎉', '😢', '😮', '😡', '👏', '🔥',
        '🥳', '😎', '🤩', '😜', '🤔', '🙄', '😴', '😇', '🤯', '💩',
        '🤗', '🤫', '🤭', '🤓', '🤪', '🤥', '🤡', '🤠', '🤢', '🤧',
        '😷', '🤕', '🤒', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃',
        '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈',
        '🙉', '🙊', '🐵', '🐒', '🦍', '🐶', '🐕', '🐩', '🐺', '🦊',
        '🦝', '🐱', '🐈', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄'
    ];  

    const handleSetShowSelectCheckbox = () => {
        setShowSelectMessageCheckbox(!showSelectMessageCheckbox);
        handleClose();
    };

    const handleEditMessage = async () => {
        try {
            await api.put(`/messages/${message.id}`);
        } catch (err) {
            toastError(err);
        }
    }

    const handleReplyMessage = () => {
        setReplyingMessage(message);
        handleClose();
    };

    const handleOpenConfirmationModal = e => {
        setConfirmationOpen(true);
        handleClose();
    };

    const handleOpenEditMessageModal = e => {
        setEditMessageOpenModal(true);
        setMessageEdit(message)
        handleClose();
    };

    return (
        <>
            {/* COMENTADO PARA EVITAR ERRO DE COMPILAÇÃO
            <ForwardModal
                modalOpen={forwardMessageModalOpen}
                messages={selectedMessages}
                onClose={(e) => {
                    setForwardMessageModalOpen(false);
                    setShowSelectMessageCheckbox(false);
                }}
            /> 
            */}
            
            <ConfirmationModal
                title={i18n.t("messageOptionsMenu.confirmationModal.title")}
                open={confirmationOpen}
                onClose={setConfirmationOpen}
                onConfirm={handleDeleteMessage}
            >
                {i18n.t("messageOptionsMenu.confirmationModal.message")}
            </ConfirmationModal>
            <EditMessageModal
                title={i18n.t("messageOptionsMenu.editMessageModal.title")}
                open={confirmationEditOpen}
                onClose={setEditMessageOpenModal}
                onSave={handleEditMessage}
                message={message}
            >
                {i18n.t("messageOptionsMenu.confirmationModal.message")}
            </EditMessageModal>
            <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleClose}
                PaperProps={{
                    style: { borderRadius: 12, boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }
                }}
            >
                <MenuItem onClick={handleSetShowSelectCheckbox}>
                    <ForwardIcon fontSize="small" className={classes.menuItemIcon} />
                    {i18n.t("messageOptionsMenu.forward")}
                </MenuItem>
                
                <MenuItem onClick={handleReplyMessage}>
                    <ReplyIcon fontSize="small" className={classes.menuItemIcon} />
                    {i18n.t("messageOptionsMenu.reply")}
                </MenuItem>

                {message.fromMe && (
                    <MenuItem onClick={handleOpenEditMessageModal}>
                        <EditIcon fontSize="small" className={classes.menuItemIcon} />
                        {i18n.t("messageOptionsMenu.edit")}
                    </MenuItem>
                )}

                {message.fromMe && (
                    <MenuItem onClick={handleOpenConfirmationModal} style={{color: '#EF4444'}}>
                        <DeleteIcon fontSize="small" style={{marginRight: 10}} />
                        {i18n.t("messageOptionsMenu.delete")}
                    </MenuItem>
                )}
                
                <MenuItem onClick={openReactionsMenu}>
                    <span style={{marginRight: 10}}>😀</span> 
                    {i18n.t("messageOptionsMenu.react")}
                </MenuItem>
            </Menu>
            <Popover
                open={Boolean(reactionAnchorEl)}
                anchorEl={reactionAnchorEl}
                onClose={closeReactionsMenu}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                PaperProps={{ className: classes.reactionPopover }}
            >
                <div className={classes.hideScrollbar}>
                    <Grid container className={classes.gridContainer}>
                        {availableReactions.slice(0, 6).map(reaction => (
                            <IconButton 
                                key={reaction} 
                                className={classes.reactionButton} 
                                onClick={() => handleReactToMessage(reaction)}
                            >
                                {reaction}
                            </IconButton>
                        ))}
                        <IconButton className={classes.reactionButton} onClick={openMoreReactionsMenu}>
                            <AddIcon />
                        </IconButton>
                    </Grid>
                </div>
            </Popover>
            <Popover
                open={Boolean(moreAnchorEl)}
                anchorEl={moreAnchorEl}
                onClose={closeMoreReactionsMenu}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                PaperProps={{
                    style: { width: 'auto', maxWidth: '400px', borderRadius: '6px' }
                }}
            >
                <div className={classes.popoverContent}>
                    <Grid container spacing={1} className={classes.gridContainer}>
                        {availableReactions.map(reaction => (
                            <Grid item key={reaction}>
                                <IconButton className={classes.iconButton} onClick={() => handleReactToMessage(reaction)}>
                                    {reaction}
                                </IconButton>
                            </Grid>
                        ))}
                    </Grid>
                </div>
            </Popover>
        </>
    );
};

MessageOptionsMenu.propTypes = {
    message: PropTypes.object,
    menuOpen: PropTypes.bool.isRequired,
    handleClose: PropTypes.func.isRequired,
    anchorEl: PropTypes.object,
    onReaction: PropTypes.func, // Callback opcional chamado após uma reação
    availableReactions: PropTypes.arrayOf(PropTypes.string) // Lista opcional de reações disponíveis
}

export default MessageOptionsMenu;