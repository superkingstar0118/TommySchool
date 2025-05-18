import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

// Define a schema for a criterion
const criterionSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Criterion name is required"),
  description: z.string().min(1, "Criterion description is required"),
});

export type Criterion = z.infer<typeof criterionSchema>;

// Define the form schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  criteria: z.array(criterionSchema).min(1, "At least one criterion is required"),
});

export type RubricFormValues = z.infer<typeof formSchema>;

interface RubricFormProps {
  initialData?: RubricFormValues;
  onSubmit: (data: RubricFormValues) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const RubricForm = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: RubricFormProps) => {
  const form = useForm<RubricFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      criteria: [{ name: "", description: "" }],
    },
  });

  const [criteria, setCriteria] = useState<Criterion[]>(
    initialData?.criteria || [{ name: "", description: "" }]
  );

  // Update the criteria in the form when they change
  useEffect(() => {
    form.setValue("criteria", criteria);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [criteria]);

  const addCriterion = () => {
    setCriteria([...criteria, { name: "", description: "" }]);
  };

  const removeCriterion = (index: number) => {
    if (criteria.length > 1) {
      const newCriteria = [...criteria];
      newCriteria.splice(index, 1);
      setCriteria(newCriteria);
    }
  };

  const updateCriterion = (index: number, field: keyof Criterion, value: string) => {
    const newCriteria = [...criteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    setCriteria(newCriteria);
  };

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>
              {initialData ? "Edit Rubric Template" : "Create Rubric Template"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rubric Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Writing Skills Rubric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the purpose of this rubric..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <div className="flex justify-between items-center mb-4">
                <FormLabel className="text-base">Criteria</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCriterion}
                >
                  Add Criterion
                </Button>
              </div>

              <div className="space-y-4">
                {criteria.map((criterion, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Criterion {index + 1}</h4>
                        {criteria.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCriterion(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <FormLabel>Name</FormLabel>
                          <Input
                            value={criterion.name || ""}
                            onChange={(e) =>
                              updateCriterion(index, "name", e.target.value)
                            }
                            placeholder="e.g., Content Development"
                          />
                        </div>

                        <div>
                          <FormLabel>Description</FormLabel>
                          <Textarea
                            value={criterion.description || ""}
                            onChange={(e) =>
                              updateCriterion(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder="Describe what this criterion evaluates..."
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {form.formState.errors.criteria && (
                <p className="text-sm font-medium text-red-500 mt-2">
                  {form.formState.errors.criteria.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : initialData ? "Update Rubric" : "Create Rubric"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default RubricForm;
