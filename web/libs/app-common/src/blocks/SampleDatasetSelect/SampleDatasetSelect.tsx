import { Select } from "@humansignal/ui";
import { useCallback, useMemo } from "react";

type Sample = {
  title: string;
  url: string;
  description: string;
};

export function SampleDatasetSelect({
  samples,
  sample,
  onSampleApplied,
}: {
  samples: Sample[];
  sample?: Sample;
  onSampleApplied: (sample?: Sample) => void;
}) {
  const title = useMemo(() => {
    return sample?.title ?? "Select sample";
  }, [sample]);

  const onSelect = useCallback(
    (value: string) => {
      if ("__lsa" in window) {
        __lsa("sample.select", { dataset: value });
      }
      onSampleApplied(samples.find((s) => s.url === value));
    },
    [samples, onSampleApplied],
  );

  const options = useMemo(() => {
    return samples.map((sample) => ({
      value: sample.url,
      label: (
        <div className="flex flex-col">
          <div className="font-bold">{sample.title}</div>
          <div className="mt-2">{sample.description}</div>
        </div>
      ),
    }));
  }, [samples]);
  const onClick = () => {
    if ("__lsa" in window) {
      __lsa("sample.open");
    }
  };

  const selectedValueRenderer = useCallback(
    (option: any) => {
      return samples.find((o) => o.url === option.value)?.title ?? option?.label;
    },
    [samples],
  );

  return (
    <div className="flex gap-3 items-center">
      <span className="text-neutral-content-subtler">或者使用示例数据集</span>
      <Select
        value={sample?.url ?? undefined}
        placeholder="选择示例"
        onChange={onSelect}
        triggerProps={{ onClick }}
        options={options}
        selectedValueRenderer={selectedValueRenderer}
      />
    </div>
  );
}
