const alerts = {
    success(message, title = "Success") {
        return Swal.fire({
            title,
            html: message,
            icon: "success",
            timer: 2200,
            timerProgressBar: true,
            showConfirmButton: false,
            customClass: {
                popup: "swal2-border",
            },
        });
    },

    error(message, title = "Error") {
        return Swal.fire({
            title,
            html: message,
            icon: "error",
            confirmButtonText: "OK",
            customClass: {
                popup: "swal2-border",
            },
        });
    },

    info(message, title = "Info") {
        return Swal.fire({
            title,
            html: message,
            icon: "info",
            timer: 2400,
            timerProgressBar: true,
            showConfirmButton: false,
            customClass: {
                popup: "swal2-border",
            },
        });
    },

    confirm({ title = "Are you sure?", text = "This action cannot be undone.", confirmButtonText = "Yes", cancelButtonText = "Cancel", icon = "warning" } = {}) {
        return Swal.fire({
            title,
            text,
            icon,
            showCancelButton: true,
            confirmButtonText,
            cancelButtonText,
            reverseButtons: true,
            customClass: {
                popup: "swal2-border",
            },
        });
    },
};
