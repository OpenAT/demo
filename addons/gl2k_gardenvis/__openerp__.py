# -*- coding: utf-8 -*-
##############################################################################
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>
#
##############################################################################

{
    'name': 'gl2k_gardenvis',
    'summary': """FS-Online gl2k_gardenvis collect and visualize gardens in austria""",
    'description': """
FS-Online collect and visualize gardens in austria
==================================================

- Form to collect garden and garedenowner data
  - Possibillity to log in on the page to alter existing data
- Thank you page
- Map Visualization on both pages e.g.: with google maps
  - Controller to get json data vor visualization e.g.: with google maps
- Thank you E-Mail with double opt in link
  - Double Opt-In Page with possibility to create an account and set a password

    """,
    'author': 'Michael Karrer (michael.karrer@datadialog.net), DataDialog',
    'version': '1.0',
    'website': 'https://www.datadialog.net',
    'installable': True,
    'depends': [
        'auth_partner',
        'base_location',
        'web_tree_image',
    ],
    'data': [
        'views/gl2k_garden.xml',
        'views/assets_backend.xml',
    ],
}
