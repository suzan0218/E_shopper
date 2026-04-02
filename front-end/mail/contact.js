$(function () {
    const API_BASE = (window.ESHOPPER_API_BASE && window.ESHOPPER_API_BASE.trim()) || "http://localhost:8080/api";

    $("#contactForm input, #contactForm textarea").jqBootstrapValidation({
        preventSubmit: true,
        submitError: function () {},
        submitSuccess: function ($form, event) {
            event.preventDefault();

            const name = $("input#name").val();
            const email = $("input#email").val();
            const subject = $("input#subject").val();
            const message = $("textarea#message").val();

            const $button = $("#sendMessageButton");
            $button.prop("disabled", true);

            fetch(API_BASE + "/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, subject, message })
            })
                .then(async (response) => {
                    const payload = await response.json().catch(() => ({}));
                    if (!response.ok) {
                        throw new Error(payload.message || "Failed to submit contact form");
                    }
                    $('#success').html("<div class='alert alert-success'><strong>Your message has been sent.</strong></div>");
                    $('#contactForm').trigger("reset");
                })
                .catch((error) => {
                    $('#success').html("<div class='alert alert-danger'></div>");
                    $('#success > .alert-danger').append($("<strong>").text(error.message));
                })
                .finally(() => {
                    setTimeout(function () {
                        $button.prop("disabled", false);
                    }, 800);
                });
        },
        filter: function () {
            return $(this).is(":visible");
        }
    });

    $("a[data-toggle=\"tab\"]").click(function (e) {
        e.preventDefault();
        $(this).tab("show");
    });
});

$('#name').focus(function () {
    $('#success').html('');
});
