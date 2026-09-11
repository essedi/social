# Copyright 2024 Dixmit
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo import api, fields, models

from odoo.addons.mail.tools.discuss import Store


class ResPartner(models.Model):
    """Update of res.partner class to take into account the gateway."""

    _inherit = "res.partner"

    gateway_channel_ids = fields.One2many(
        "res.partner.gateway.channel", inverse_name="partner_id"
    )

    def _get_store_gateway_channel_fields(self):
        """Store fields exposing the gateway channels of a partner.

        Not added to ``_to_store_defaults`` on purpose: partners are sent to the
        client in a lot of places (mentions, avatar cards, ...). Use it only
        where the client needs the gateway channels (e.g. thread followers).
        """
        return [
            Store.Many(
                "gateway_channel_ids",
                self.env["res.partner.gateway.channel"]._get_store_fields(),
                sudo=True,
            )
        ]


class ResPartnerGatewayChannel(models.Model):
    _name = "res.partner.gateway.channel"
    _description = "Technical data used to get the gateway author"

    name = fields.Char(related="gateway_id.name")
    partner_id = fields.Many2one(
        "res.partner", required=True, readonly=True, ondelete="cascade"
    )
    gateway_id = fields.Many2one(
        "mail.gateway", required=True, readonly=True, ondelete="cascade"
    )
    gateway_token = fields.Char(readonly=True)
    company_id = fields.Many2one(
        "res.company", related="gateway_id.company_id", store=True
    )

    _unique_partner_gateway = models.Constraint(
        "UNIQUE(partner_id, gateway_id)",
        "Partner can only have one configuration for each gateway.",
    )

    @api.depends_context("mail_gateway_partner_info")
    def _compute_display_name(self):
        # Be able to tell to which partner belongs the gateway partner channel
        # e.g.: picking it from a selector
        if not self.env.context.get("mail_gateway_partner_info"):
            return super()._compute_display_name()
        for gateway_channel in self:
            gateway_channel.display_name = (
                f"{gateway_channel.partner_id.display_name} ({gateway_channel.name})"
            )

    def _get_store_fields(self):
        """Store fields sent to the client for a gateway channel."""
        return ["name", Store.One("gateway_id", ["name", "gateway_type"])]
