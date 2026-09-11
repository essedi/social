# Copyright 2024 Dixmit
# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

from odoo import models


class ResPartner(models.Model):
    _inherit = "res.partner"

    def _whatsapp_get_partner(self):
        return self
