import React from "react";
import { Avatar, Typography, makeStyles, Box } from "@material-ui/core";
import { getInitials } from "../../helpers/getInitials";
import { generateColor } from "../../helpers/colorGenerator";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        marginRight: "auto", // Empurra os botões para a direita
        maxWidth: "50%", // Garante espaço para os botões
        [theme.breakpoints.down("xs")]: {
            maxWidth: "100%",
            marginRight: 0,
            marginBottom: theme.spacing(1),
        },
    },
    avatar: {
        width: 40,
        height: 40,
        marginRight: theme.spacing(1.5),
        fontWeight: "bold",
        color: "#fff",
    },
    infoContainer: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        overflow: "hidden", // Necessário para text-overflow funcionar
    },
    title: {
        fontWeight: 600,
        fontSize: "0.95rem",
        lineHeight: "1.2",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        color: theme.palette.text.primary,
    },
    subheader: {
        fontSize: "0.75rem",
        color: theme.palette.text.secondary,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "flex",
        alignItems: "center",
        gap: 4,
    },
    ticketId: {
        fontWeight: "bold",
        color: theme.palette.primary.main,
    },
}));

const TicketInfo = ({ contact, ticket, onClick }) => {
    const classes = useStyles();
    const { user } = ticket;
    const contactName = contact?.name || "";

    return (
        <div className={classes.root} onClick={onClick}>
            <Avatar
                src={contact?.profilePicUrl}
                alt={contactName}
                className={classes.avatar}
                style={{ backgroundColor: generateColor(contact?.number) }}
            >
                {getInitials(contactName)}
            </Avatar>

            <Box className={classes.infoContainer}>
                <Typography className={classes.title} title={contactName}>
                    {contactName}
                </Typography>

                <div className={classes.subheader}>
                    {user && (
                        <span>
                            {i18n.t("messagesList.header.assignedTo")} {user.name}
                        </span>
                    )}
                    <span className={classes.ticketId}>#{ticket.id}</span>
                </div>
            </Box>
        </div>
    );
};

export default TicketInfo;
