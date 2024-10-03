import { useContext } from "react";
import { ButtonSubtext } from ".";
import { IdeMessengerContext } from "../context/IdeMessenger";

function AddModelButtonSubtext() {
  const ideMessenger = useContext(IdeMessengerContext);

  return (
    <ButtonSubtext>
      这将更新您的{" "}
      <span
        className="underline cursor-pointer"
        onClick={() => ideMessenger.post("openConfigJson", undefined)}
      >
        配置文件
      </span>
    </ButtonSubtext>
  );
}

export default AddModelButtonSubtext;
