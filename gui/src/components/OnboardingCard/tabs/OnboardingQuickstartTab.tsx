import ContinueLogo from "../../ContinueLogo";
import QuickStartSubmitButton from "../components/QuickStartSubmitButton";

function OnboardingQuickstartTab() {
  return (
    <div className="flex justify-center items-center">
      <div className="flex flex-col items-center justify-center w-3/4 text-center">
        <div className="mr-5">
          <ContinueLogo height={75} />
        </div>

        <p className="text-sm">
        使用我们的 API 密钥快速启动并运行。试用后，我们将帮助您设置自己的模型。
        </p>

        <p className="text-sm">
        为防止滥用，我们将要求您登录 GitHub。
        </p>

        <QuickStartSubmitButton />
      </div>
    </div>
  );
}

export default OnboardingQuickstartTab;
