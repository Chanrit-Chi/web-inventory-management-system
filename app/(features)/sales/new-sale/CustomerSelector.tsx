import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Customer, CustomerCreate } from "@/schemas/type-export.schema";
import { Select } from "@radix-ui/react-select";
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CustomerSelectorProps {
  customers: Customer[];
  customerId: string | null;
  onCustomerChange: (customerId: string) => void;
  onAddCustomer: (customer: CustomerCreate) => void;
}

export const CustomerSelector = ({
  customers,
  customerId,
  onCustomerChange,
  onAddCustomer,
}: CustomerSelectorProps) => {
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  const addCustomer = () => {
    if (!newCustomerName.trim()) {
      alert("Please enter customer name");
      return;
    }

    const newCustomer: CustomerCreate = {
      name: newCustomerName.trim(),
      email: newCustomerEmail.trim() || null,
      phone: newCustomerPhone.trim() || null,
    };

    onAddCustomer(newCustomer);

    // Reset form and close dialog
    setNewCustomerName("");
    setNewCustomerEmail("");
    setNewCustomerPhone("");
    setShowCustomerDialog(false);
  };

  return (
    <div>
      <Label className="block text-sm font-medium mb-2 ">
        Customer <span className="text-red-500">*</span>
      </Label>
      <div className="flex gap-2 items-center">
        <Select>
          <SelectTrigger className="w-[180px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2  focus:border-transparent outline-none">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Select Customer</SelectLabel>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
          <DialogTrigger asChild>
            <Button
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
              title="Add New Customer"
            >
              <UserPlus size={20} />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="123-456-7890"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCustomerDialog(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={addCustomer}
                className="cursor-pointer"
              >
                Add Customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
