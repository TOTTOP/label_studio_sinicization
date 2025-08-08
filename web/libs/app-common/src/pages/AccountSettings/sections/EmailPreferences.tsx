import { useCallback, useState } from "react";
import { Checkbox, Spinner } from "@humansignal/ui";

/**
 * FIXME: This is legacy imports. We're not supposed to use such statements
 * each one of these eventually has to be migrated to core/ui
 */
import { useAPI } from "apps/labelstudio/src/providers/ApiProvider";
import { useConfig } from "apps/labelstudio/src/providers/ConfigProvider";
import { useCurrentUser } from "apps/labelstudio/src/providers/CurrentUser";

export const EmailPreferences = () => {
  const config = useConfig();
  const { user } = useCurrentUser();
  const api = useAPI();
  const [isLoading, setIsLoading] = useState(false);
  const [isAllowNewsLetter, setIsAllowNewsLetter] = useState(config.user.allow_newsletters);

  const toggleHandler = useCallback(
    async (e: any) => {
      setIsAllowNewsLetter(e.target.checked);
      setIsLoading(true);
      await api.callApi("updateUser", {
        params: {
          pk: user?.id,
        },
        body: {
          allow_newsletters: e.target.checked ? 1 : 0,
        },
      });
      setIsLoading(false);
    },
    [user?.id],
  );

  return (
    <div id="email-preferences">
      {isLoading ? (
        <Spinner />
      ) : (
        <Checkbox checked={isAllowNewsLetter} onChange={toggleHandler}>
          订阅 HumanSignal 新闻以及海蒂提供的提示
        </Checkbox>
      )}
    </div>
  );
};
