# -*- coding: utf-'8' "-*-"

from openerp import models, fields, api, tools, registry
from openerp.addons.fso_base.tools.image import resize_to_thumbnail
from openerp.tools.image import image_resize_image
from openerp.tools.translate import _

import logging
logger = logging.getLogger(__name__)

# TODO: Allow public user group to access the image fields or they could not be opened without login!
#       BUT Keep record data safe!


class GL2KGarden(models.Model):
    _name = "gl2k.garden"

    # Fields to watch for geo localization
    _geo_location_fields = ('zip', 'country_id', 'city')

    # Fileds to watch for refreshing the materialized views
    _refresh_matviews_fields = ('zip', 'garden_size')

    # States to sum for the visualization (materialized views)
    _valid_states = ('new', 'approved')

    def init(self, cr):
        # State materialized view (Bundesland)
        cr.execute("SELECT * FROM pg_class WHERE relkind = 'm' and relname = 'garden_rep_state';")
        if cr.fetchone():
            cr.execute("DROP MATERIALIZED VIEW garden_rep_state;")
        cr.execute("CREATE materialized VIEW garden_rep_state "
                   "AS "
                   "  SELECT "
                   "    gl2k_garden.cmp_state_id, "
                   "    res_country_state.name as cmp_state, "
                   "    sum(gl2k_garden.garden_size) as garden_size, "
                   "    json_agg(gl2k_garden.id) as record_ids, "
                   "    json_agg(gl2k_garden.id) as thumbnail_record_ids, "
                   "    json_agg(DISTINCT gl2k_garden.zip) as zip_list "
                   "FROM "
                   "  gl2k_garden "
                   "  LEFT JOIN res_country_state ON gl2k_garden.cmp_state_id = res_country_state.id "
                   "WHERE "
                   "  gl2k_garden.cmp_state_id IS NOT NULL AND gl2k_garden.state in "+str(self._valid_states)+" "
                   "group by gl2k_garden.cmp_state_id, res_country_state.name; ")

        # Community materialized view (Gemeinde)
        cr.execute("SELECT * FROM pg_class WHERE relkind = 'm' and relname = 'garden_rep_community';")
        if cr.fetchone():
            cr.execute("DROP MATERIALIZED VIEW garden_rep_community;")
        cr.execute("CREATE materialized VIEW garden_rep_community "
                   "AS "
                   "  SELECT "
                   "    gl2k_garden.cmp_community_code, "
                   "    gl2k_garden.cmp_community, "
                   "    sum(gl2k_garden.garden_size) as garden_size, "
                   "    json_agg(gl2k_garden.id) as record_ids, "
                   "    json_agg(gl2k_garden.id) as thumbnail_record_ids, "
                   "    json_agg(DISTINCT gl2k_garden.zip) as zip_list "
                   "FROM "
                   "  gl2k_garden "
                   "WHERE "
                   "  gl2k_garden.cmp_community IS NOT NULL AND gl2k_garden.state in "+str(self._valid_states)+" "                   
                   "group by gl2k_garden.cmp_community_code, gl2k_garden.cmp_community; ")

    # ------
    # FIELDS
    # ------
    def _default_country(self):
        austria = self.env['res.country'].search([('code', '=', 'AT')], limit=1)
        return austria or False

    state = fields.Selection(string="State", selection=[('new', 'New'),
                                                        ('approved', 'Approved'),
                                                        ('rejected', 'Rejected'),
                                                        ('invalid', 'Invalid'),
                                                        ('disabled', 'Disabled')],
                             default="new", index=True)

    # Form input fields
    # -----------------
    email = fields.Char(string="E-Mail", required=True)
    newsletter = fields.Boolean(string="Newsletter", help="Subscribe for the Newsletter")

    title = fields.Char(string="Title")
    firstname = fields.Char(string="Firstname")
    lastname = fields.Char(string="Lastname", required=True)

    # res.partner address
    zip = fields.Char(string="Zip", required=True, index=True)
    street = fields.Char(string="Street")
    city = fields.Char(string="City")
    country_id = fields.Many2one(string="Country", comodel_name="res.country", required=True,
                                 default=_default_country, domain="[('code', '=', 'AT')]")

    # garden fields
    garden_size = fields.Integer(string="Garden Size m2", required=True)
    garden_image_name = fields.Char(string="Garden Image Name")
    garden_image_file = fields.Binary(string="Garden Image File")

    # Computed and system fields (non user land)
    # ------------------------------------------
    cmp_image_file = fields.Binary(string="Computed Garden Image", readonly=True,
                                   compute="compute_images", store=True)
    cmp_thumbnail_file = fields.Binary(string="Computed Garden Image Thumbnail", readonly=True,
                                       compute="compute_images", store=True)

    # Will be computed based on zip field by the help of the addon base_location
    cmp_partner_id = fields.Many2one(string="Computed Partner", comodel_name="res.partner", readonly=True, 
                                     index=True, ondelete="set null")
    cmp_better_zip_id = fields.Many2one(string="Better Zip", comodel_name="res.better.zip", readonly=True, 
                                        index=True, ondelete="set null")
    cmp_state_id = fields.Many2one(string="Computed State", comodel_name="res.country.state", readonly=True,
                                   index=True, ondelete="set null")
    cmp_county_province = fields.Char(string="Computed Province", readonly=True)
    cmp_county_province_code = fields.Char(string="Computed Province Code", readonly=True)
    cmp_community = fields.Char(string="Computed Community", readonly=True, index=True)
    cmp_community_code = fields.Char(string="Computed Community Code", readonly=True, index=True)
    cmp_city = fields.Char(string="Computed City", readonly=True)

    # Login (token/fstoken) information
    # ---------------------------------
    login_token_used = fields.Char("Login Token", readonly=True)
    # TODO: login_token_id = fields.Many2one() and other token info like CDS, Action or Origin

    # E-Mail validation / Double-Opt-In
    # ---------------------------------
    # HINT: Will change on every email change!
    email_validated = fields.Char(string="E-Mail Validated", readonly=True)
    email_validated_token = fields.Char(string="E-Mail Validated Token", readonly=True,
                                        help="For Double-Opt-In Link")
    email_validated_time = fields.Datetime(string="E-Mail Validated At", readonly=True,
                                           help="E-Mail-Validate-Link validated at datetime")

    # ONCHANGE
    # --------
    # Update fields based on zip field
    # HINT: This will not be stored by the gui since all fields are read only therefore it is added to create and write
    #       Still this is is left here because it is very convenient to see the cmp field values directly
    @api.onchange(*_geo_location_fields)
    def onchange_zip(self):
        for r in self:
            cmp_fields_vals = self.get_cmp_fields_vals(zip=r.zip, country_id=r.country_id.id, city=r.city)

            for v in cmp_fields_vals:
                r[v] = cmp_fields_vals[v]

    # COMPUTED
    # --------
    @api.depends('garden_image_file')
    def compute_images(self):
        for r in self:
            if r.garden_image_file:
                r.cmp_image_file = image_resize_image(r.garden_image_file, size=(1200, 1200), avoid_if_small=True)
                r.cmp_thumbnail_file = resize_to_thumbnail(img=r.garden_image_file, box=(300, 300))
            else:
                r.cmp_image_file = False
                r.cmp_thumbnail_file = False

    # -------------
    # MODEL METHODS
    # -------------
    @api.model
    def get_cmp_fields_vals(self, zip='', country_id='', city=''):
        # TODO: search for the partner id either by token or by data matching

        better_zip = False
        if zip and country_id and city:
            better_zip = self.env['res.better.zip'].search([('name', '=', zip),
                                                            ('country_id', '=', country_id),
                                                            ('city', '=', city)
                                                            ], limit=1)
            if not better_zip:
                better_zip = self.env['res.better.zip'].search([('name', '=', zip),
                                                                ('country_id', '=', country_id),
                                                                ('city', 'ilike', city)
                                                                ], limit=1)
        if not better_zip and zip and country_id:
            better_zip = self.env['res.better.zip'].search([('name', '=', zip),
                                                            ('country_id', '=', country_id),
                                                            ], limit=1)

        return {
            'cmp_better_zip_id': better_zip.id if better_zip else False,
            'cmp_state_id': better_zip.state_id.id if better_zip and better_zip.state_id else False,
            'cmp_city': better_zip.city if better_zip else False,
            'cmp_county_province': better_zip.county_province if better_zip else False,
            'cmp_county_province_code': better_zip.county_province_code if better_zip else False,
            'cmp_community': better_zip.community if better_zip else False,
            'cmp_community_code': better_zip.community_code if better_zip else False,
        }

    @api.model
    def refresh_materialized_views(self):
        logger.info("REFRESH MATERIALIZED VIEWS")
        cr = self.env.cr
        cr.execute("REFRESH MATERIALIZED VIEW garden_rep_state; REFRESH MATERIALIZED VIEW garden_rep_community;")

    # ----
    # CRUD
    # ----
    @api.model
    def create(self, vals):

        country_id = vals.get('country_id', False)
        # Check for default country
        if country_id and self._default_country() and country_id != self._default_country().id:
            logger.error("Country must be Austria!")
            vals['state'] = 'invalid'

        # Append computed fields values
        if vals.get('zip', False) and vals.get('country_id', False):
            vals.update(self.get_cmp_fields_vals(zip=vals.get('zip'),
                                                 country_id=vals.get('country_id'),
                                                 city=vals.get('city', '')))

        # Update materialized views
        res = super(GL2KGarden, self).create(vals)
        res.refresh_materialized_views()

        return res

    @api.multi
    def write(self, vals):
        # Update self first
        # HINT: res is just a boolean
        res = super(GL2KGarden, self).write(vals)

        # Update computed fields
        if res and any(f in vals for f in self._geo_location_fields):
            for r in self:
                cmp_vals = {}
                # Check for default country
                if r.country_id and self._default_country() and r.country_id.id != self._default_country().id:
                    logger.error("Country must be Austria (ID %s)" % r.id)
                    cmp_vals['state'] = 'invalid'
                # Get computed field values
                cmp_vals.update(r.get_cmp_fields_vals(zip=r.zip, country_id=r.country_id.id, city=r.city))
                # Update record
                r.write(cmp_vals)

        # Update materialized views
        if any(f in vals for f in self._refresh_matviews_fields):
            self.refresh_materialized_views()

        return res
