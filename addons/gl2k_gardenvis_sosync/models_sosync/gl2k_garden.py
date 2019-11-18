# -*- coding: utf-'8' "-*-"

from openerp import models, fields


class GL2KGardenSosync(models.Model):
    _name = "gl2k.garden"
    _inherit = ["gl2k.garden", "base.sosync"]

    # -------
    # Fields
    # -------

    # Form input fields
    # -----------------
    # New fields as requested by Gerald
    type = fields.Selection(sosync="True")
    organisation_name = fields.Char(sosync="True")
    #
    state = fields.Selection(sosync="True")
    email = fields.Char(sosync="True")
    newsletter = fields.Boolean(sosync="True")
    salutation = fields.Char(sosync="True")
    firstname = fields.Char(sosync="True")
    lastname = fields.Char(sosync="True")

    # res.partner address
    # --------------------
    zip = fields.Char(sosync="True")
    street = fields.Char(sosync="True")
    street_number_web = fields.Char(sosync="True")
    city = fields.Char(sosync="True")
    country_id = fields.Many2one(sosync="True")

    # garden fields
    # --------------
    garden_size = fields.Float(sosync="True")
    garden_image_name = fields.Char(sosync="True")
    garden_image_file = fields.Binary(sosync="True")

    # computed fields
    # ----------------
    # Not needed

    # email validation fields
    # ------------------------
    # Not needed

    # res.partner id
    # ---------------
    partner_id = fields.Many2one(sosync="True")
