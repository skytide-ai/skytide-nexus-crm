import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Bot } from "lucide-react";

interface BotWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDisableAndSend: () => void;
}

export function BotWarningDialog({
  isOpen,
  onClose,
  onDisableAndSend,
}: BotWarningDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-amber-100 p-2 rounded-full">
              <Bot className="h-6 w-6 text-amber-600" />
            </div>
            <AlertDialogTitle>Bot activo</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            El bot está activado en este momento. Si envías un mensaje, el bot podría responder automáticamente.
            <p className="mt-2 font-medium text-foreground">
              ¿Deseas desactivar el bot antes de enviar tu mensaje?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onDisableAndSend}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Desactivar bot y enviar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
