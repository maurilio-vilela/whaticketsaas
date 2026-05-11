import React from 'react';
import { parse } from 'vcard-parser';
import { makeStyles } from '@material-ui/core/styles';
import { Paper, Typography, Avatar, Button, Divider, Grid } from '@material-ui/core';
import PersonIcon from '@material-ui/icons/Person';
import WhatsAppIcon from '@material-ui/icons/WhatsApp';

const useStyles = makeStyles((theme) => ({
    card: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: theme.palette.mode === 'light' ? '#F9FAFB' : '#374151',
        borderRadius: 12,
        padding: 16,
        border: `1px solid ${theme.palette.mode === 'light' ? '#E5E7EB' : '#4B5563'}`,
        marginTop: 8,
        marginBottom: 8,
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        backgroundColor: '#10B981', // Emerald
        marginRight: 12,
    },
    name: {
        fontWeight: 600,
        fontSize: '1rem',
        color: theme.palette.text.primary,
    },
    number: {
        color: theme.palette.text.secondary,
        fontSize: '0.875rem',
    },
    button: {
        marginTop: 10,
        backgroundColor: '#10B981',
        color: '#fff',
        textTransform: 'none',
        '&:hover': {
            backgroundColor: '#059669',
        }
    }
}));

const VcardPreview = ({ contact, numbers }) => {
    const classes = useStyles();
    // numbers vem como string ou objeto às vezes, dependendo do parsing anterior
    const phoneNumber = typeof numbers === 'object' ? numbers?.number : numbers;

    return (
        <Paper elevation={0} className={classes.card}>
            <div className={classes.header}>
                <Avatar className={classes.avatar}>
                    <PersonIcon />
                </Avatar>
                <div>
                    <Typography className={classes.name}>
                        {contact || 'Contato Desconhecido'}
                    </Typography>
                    <Typography className={classes.number}>
                        {phoneNumber}
                    </Typography>
                </div>
            </div>
            <Divider />
            <Button 
                fullWidth 
                variant="contained" 
                disableElevation
                className={classes.button}
                startIcon={<WhatsAppIcon />}
                onClick={() => window.open(`https://wa.me/${phoneNumber?.replace(/[^0-9]/g, '')}`, '_blank')}
            >
                Conversar
            </Button>
        </Paper>
    );
};

export default VcardPreview;