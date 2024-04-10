import { HOST_ADDRESSES } from "../constants";
import { HyperBridgeService } from "../services/hyperbridge.service";
import { RelayerService } from "../services/relayer.service";
import { TransferService } from "../services/transfer.service";
import { SupportedChain } from "../types";
import { TransferEvent } from "../types/contracts/ERC6160Ext20Abi";

/**
 * Handles the Transfer event from Hyper-usd contract
 */
export async function handleTransferEvent(
  event: TransferEvent,
  network: SupportedChain,
): Promise<void> {
  const log_info = {
    message: "Handling Transfer event",
    event: event,
  };

  logger.debug(JSON.stringify(log_info));

  const { args, transactionHash } = event;
  const { from, to, value } = args;

  // Only store transfers from/to the Hyperbridge host contracts
  if (HOST_ADDRESSES.includes(from) || HOST_ADDRESSES.includes(to)) {
    const transfer = await TransferService.storeTransfer({
      from,
      to,
      value,
      transactionHash,
      network,
    });

    if (HOST_ADDRESSES.includes(from)) {
      Promise.all([
        await RelayerService.updateFeesEarned(transfer),
        await HyperBridgeService.updateFeesPayedOut(transfer),
      ]);
    }

    if (HOST_ADDRESSES.includes(to)) {
      await HyperBridgeService.updateTotalTransfersIn(transfer);
    }
  }
}

// Handles transfers for the Ethereum sepolia network
export async function handleEthereumSepoliaTransferEvent(
  event: TransferEvent,
): Promise<void> {
  await handleTransferEvent(event, SupportedChain.ETHEREUM_SEPOLIA);
}
