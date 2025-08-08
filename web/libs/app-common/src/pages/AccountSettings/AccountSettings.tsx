import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@humansignal/ui/lib/card-new/card";
import { useMemo } from "react";
import { Redirect } from "react-router-dom";
import styles from "./AccountSettings.module.scss";
import { accountSettingsSections } from "./sections";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { settingsAtom } from "./atoms";

/**
 * FIXME: This is legacy imports. We're not supposed to use such statements
 * each one of these eventually has to be migrated to core/ui
 */
import { SidebarMenu } from "apps/labelstudio/src/components/SidebarMenu/SidebarMenu";

const AccountSettingsPage = () => {
  const settings = useAtomValue(settingsAtom);
  const contentClassName = clsx(styles.accountSettings__content, {
    [styles.accountSettingsPadding]: window.APP_SETTINGS.billing !== undefined,
  });
  const resolvedSections = useMemo(() => {
    return settings.data ? accountSettingsSections(settings.data) : [];
  }, [settings.data]);

  const menuItems = useMemo(
    () =>
      resolvedSections.map(({ title, id }) => ({
        title,
        path: () => {
          if (!window?.location) return;
          window.location.hash = `#${id}`;
        },
      })),
    [accountSettingsSections, settings.data],
  );

  return (
    <div className={styles.accountSettings}>
      <SidebarMenu menuItems={menuItems} path={AccountSettingsPage.path}>
        <div className={contentClassName}>
          {resolvedSections?.map(({ title, component: Section, description: Description, id }) => (
            <Card key={id}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                {Description && (
                  <CardDescription>
                    <Description />
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Section />
              </CardContent>
            </Card>
          ))}
        </div>
      </SidebarMenu>
    </div>
  );
};

AccountSettingsPage.title = "我的账户";
AccountSettingsPage.path = "/user/account";
AccountSettingsPage.exact = true;
AccountSettingsPage.routes = () => [
  {
    title: () => "我的账户",
    exact: true,
    component: () => {
      return <Redirect to={AccountSettingsPage.path} />;
    },
    // pages: {
    //   DataManagerPage,
    //   SettingsPage,
    // },
  },
];

export { AccountSettingsPage };
