import { IconLaunch, IconFileCopy, Label } from "@humansignal/ui";
import styles from "./PersonalAccessToken.module.scss";
import { atomWithMutation, atomWithQuery } from "jotai-tanstack-query";
import { atom, useAtomValue } from "jotai";
import { useCopyText } from "@humansignal/core/lib/hooks/useCopyText";

/**
 * FIXME: This is legacy imports. We're not supposed to use such statements
 * each one of these eventually has to be migrated to core/ui
 */
import { Input, TextArea } from "apps/labelstudio/src/components/Form";
import { Button } from "apps/labelstudio/src/components/Button/Button";

const tokenAtom = atomWithQuery(() => ({
  queryKey: ["access-token"],
  queryFn: async () => {
    const result = await fetch("/api/current-user/token");
    return result.json();
  },
}));

const resetTokenAtom = atomWithMutation(() => ({
  mutationKey: ["reset-token"],
  mutationFn: async () => {
    const result = await fetch("/api/current-user/reset-token", {
      method: "post",
    });
    return result.json();
  },
}));

const currentTokenAtom = atom((get) => {
  const initialToken = get(tokenAtom).data?.token;
  const resetToken = get(resetTokenAtom).data?.token;

  return resetToken ?? initialToken;
});

const curlStringAtom = atom((get) => {
  const currentToken = get(currentTokenAtom);
  const curlString = `curl -X GET ${location.origin}/api/projects/ -H 'Authorization: Token ${currentToken}'`;
  return curlString;
});

export const PersonalAccessToken = () => {
  const token = useAtomValue(currentTokenAtom);
  const reset = useAtomValue(resetTokenAtom);
  const curl = useAtomValue(curlStringAtom);
  const [copyToken, tokenCopied] = useCopyText(token);
  const [copyCurl, curlCopied] = useCopyText(curl);

  return (
    <div id="personal-access-token">
      <div className="flex flex-col gap-6">
        <div>
          <Label text="Access Token" className={styles.label} />
          <div className="flex gap-2 w-full justify-between">
            <Input name="token" className={styles.input} readOnly value={token} />
            <Button icon={<IconFileCopy />} onClick={copyToken} disabled={tokenCopied}>
              {tokenCopied ? "Copied!" : "Copy"}
            </Button>
            <Button look="danger" onClick={reset.mutate}>
              重置
            </Button>
          </div>
        </div>
        <div>
          <Label text="Example CURL Request" className={styles.label} />
          <div className="flex gap-2 w-full justify-between">
            <TextArea
              name="example-curl"
              readOnly
              className={styles.textarea}
              rawClassName={styles.textarea}
              value={curl}
            />
            <Button icon={<IconFileCopy />} onClick={copyCurl} disabled={curlCopied}>
              {curlCopied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function PersonalAccessTokenDescription() {
  return (
    <p className="m-0">
     
      使用您的access token对我们的 API 进行身份验证。
      {!window.APP_SETTINGS?.whitelabel_is_active && (
        <>
          {" "}
          See{" "}
          <a href="https://labelstud.io/guide/api.html" target="_blank" rel="noreferrer" className="inline-flex gap-1">
            Docs{" "}
            <span>
              <IconLaunch className="h-6 w-6" />
            </span>
          </a>
        </>
      )}
    </p>
  );
}
