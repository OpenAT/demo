(function () {
    'use strict';

    openerp.website.EditorBar.include({

        edit: function () {
            console.log('Empty #gardenMap on edit!');
            $('#gardenMap').empty();
            return this._super.apply(this, arguments);
        },

        save: function () {
            console.log('Empty #gardenMap on save!');
            $('#gardenMap').empty();
            // this._super();
            return this._super.apply(this, arguments);
        },
    });

})();
