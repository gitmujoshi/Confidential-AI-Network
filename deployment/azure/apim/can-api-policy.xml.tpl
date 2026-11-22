<policies>
  <inbound>
    <base />
    <choose>
      <when condition="@(context.Request.Url.Path.Contains(&quot;/api/health&quot;))" />
      <otherwise>
        <validate-jwt header-name="Authorization" failed-validation-httpcode="401" require-expiration-time="true">
          <openid-config url="https://login.microsoftonline.com/${tenant_id}/v2.0/.well-known/openid-configuration" />
          <audiences>
            <audience>${audience}</audience>
          </audiences>
          <required-claims>
            <claim name="roles" match="any">
              <value>TDC</value>
              <value>TDP</value>
              <value>CCRP</value>
              <value>AppAdmin</value>
            </claim>
          </required-claims>
        </validate-jwt>
      </otherwise>
    </choose>
    <set-backend-service backend-id="can-backend" />
  </inbound>
  <backend>
    <base />
  </backend>
  <outbound>
    <base />
  </outbound>
  <on-error>
    <base />
  </on-error>
</policies>
