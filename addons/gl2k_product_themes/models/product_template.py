# -*- coding: utf-'8' "-*-"
from openerp import api, models, fields

__author__ = 'Michael Karrer'


# Product Template
class ProductTemplate(models.Model):
    _inherit = 'product.template'

    website_theme = fields.Selection(selection_add=[('gl2k_inline', 'Global 2000 Inline'),
                                                    ('gl2k_inline_test', 'Global 2000 Inline TEST')])
