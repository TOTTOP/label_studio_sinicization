import { useAtomValue } from "jotai";
import { settingsAtom, TOKEN_SETTINGS_KEY } from "@humansignal/app-common/pages/AccountSettings/atoms";
import { queryClientAtom } from "jotai-tanstack-query";

import { Form, Input, Toggle } from "apps/labelstudio/src/components/Form";
import { Button } from "apps/labelstudio/src/components/Button/Button";
import type { AuthTokenSettings } from "@humansignal/app-common/pages/AccountSettings/types";
import { type ChangeEvent, useState } from "react";

export const TokenSettingsModal = ({
  showTTL,
  onSaved,
}: {
  showTTL?: boolean;
  onSaved?: () => void;
}) => {
  const settings = useAtomValue(settingsAtom);
  if (!settings.isSuccess || settings.isError || "error" in settings.data) {
    return <div>Error loading settings.</div>;
  }
  return (
    <TokenSettingsModalView
      key={settings.data?.api_tokens_enabled}
      settings={settings.data}
      showTTL={showTTL}
      onSaved={onSaved}
    />
  );
};

function TokenSettingsModalView({
  settings,
  showTTL,
  onSaved,
}: { settings: AuthTokenSettings; showTTL?: boolean; onSaved?: () => void }) {
  const [enableTTL, setEnableTTL] = useState(settings.api_tokens_enabled);
  const queryClient = useAtomValue(queryClientAtom);
  const reloadSettings = () => {
    queryClient.invalidateQueries({ queryKey: [TOKEN_SETTINGS_KEY] });
    onSaved?.();
  };
  return (
    <Form action="accessTokenUpdateSettings" onSubmit={reloadSettings}>
      <Form.Row columnCount={1}>
        <Toggle
          label="个人访问令牌"
          name="api_tokens_enabled"
          description="启用增强的令牌身份验证安全性"
          checked={settings.api_tokens_enabled ?? false}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEnableTTL(e.target.checked)}
        />
      </Form.Row>
      <Form.Row columnCount={1}>
        <Toggle
          label="旧版令牌"
          name="legacy_api_tokens_enabled"
          description="启用旧版访问令牌，这些令牌不会过期"
          checked={settings.legacy_api_tokens_enabled ?? true}
        />
      </Form.Row>
      {showTTL === true && (
        <Form.Row columnCount={1}>
          <Input
            name="api_token_ttl_days"
            label="生存时间（可选，仅适用于个人访问令牌）"
            description="令牌创建后有效的天数。在此时间段后，用户需要创建新的访问令牌"
            labelProps={{
              description:
                "令牌创建后有效的天数。在此时间段后，用户需要创建新的访问令牌",
            }}
            disabled={!enableTTL}
            type="number"
            min={10}
            max={365}
            value={settings.api_token_ttl_days ?? 30}
          />
        </Form.Row>
      )}
      <Form.Actions>
        <Button type="submit">保存</Button>
      </Form.Actions>
    </Form>
  );
}
