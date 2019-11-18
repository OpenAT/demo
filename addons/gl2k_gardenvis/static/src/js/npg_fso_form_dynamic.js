$(document).ready(function () {
    'use strict';

    // var npg_form = $(".fso_form_wrap_1");

    var organisation_name_input = $('.fso_form_wrap_1 #organisation_name');
    var organisation_name_label = $('.fso_form_wrap_1 label.f-organisation_name');
    var organisation_name_fg = organisation_name_input.closest('.form-group');

    var snippet_area_ansprechpartner = $('.fso_form_wrap_1 .ansprechpartner');

    // Initially hide snippet area ansprechpartner
    snippet_area_ansprechpartner.addClass('hide_it');

    // Initially hide input field organisation_name form group
    //organisation_name_input.prop('disabled', true);
    organisation_name_fg.addClass('hide_it');
    //organisation_name_input.prop('required', false).val('')

    $(".fso_form_wrap_1 input[type=radio][name=type]").change(function () {
        var type_selected = $(this).val();
        console.log($(this).val(), $(this));

        //var type_selected = $(this).value;
        //var type_selected_text = $(this).content;

        // Hide organisation_name input and ansprechpartner snippet area
        if ( !type_selected || type_selected === "privat") {
            snippet_area_ansprechpartner.addClass('hide_it');

            organisation_name_fg.addClass('hide_it');
            organisation_name_label.removeClass('mandatory text-danger');
            organisation_name_input.prop('required', false).val('')
            //organisation_name_input.prop('disabled', true);
        }

        // Show organisation_name input and ansprechpartner snippet area
        else {
            snippet_area_ansprechpartner.removeClass('hide_it');

            organisation_name_fg.removeClass('hide_it');
            organisation_name_label.addClass('mandatory text-danger');
            organisation_name_input.prop('required‚', true);


            if (type_selected === "gemeinde") {
                organisation_name_label.text("Name der Gemeinde");
            }
            else if (type_selected === "verein") {
                organisation_name_label.text("Vereinsname");
            }
            else if (type_selected === "schule") {
                organisation_name_label.text("Name der Schule");
            }
            else {
                organisation_name_label.text("Name");
            }



            //organisation_name_input.prop('disabled', false).prop('required', true);
        }
    });

});
