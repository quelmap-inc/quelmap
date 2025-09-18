import { useForm } from 'react-hook-form'
import { useRenameTable } from '@/hooks/use-table-data'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface RenameTableFormProps {
  tableName: string
  onSuccess?: (newTableName: string) => void
  onCancel: () => void
}

interface FormValues {
  newTableName: string
}

export const RenameTableForm = ({
  tableName,
  onSuccess,
  onCancel,
}: RenameTableFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      newTableName: tableName,
    },
  })

  const renameMutationOnError = (error: any) => {
    toast.error('Failed to rename table')
    console.error('Rename table error:', error)
    if (error?.response?.data?.detail) {
      console.error('Error detail:', error.response.data.detail)
    }
    onCancel();
  }
  const renameMutation = useRenameTable(renameMutationOnError)

  const onSubmit = async (data: FormValues) => {
    if (data.newTableName === tableName) {
      onCancel()
      return
    }

    try {
      await renameMutation.mutateAsync({
        tableName,
        newTableName: data.newTableName,
      })
      onSuccess?.(data.newTableName)
    } catch (error) {
  console.error('Failed to rename table:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex items-center gap-2'>
      <input
        {...register('newTableName', {
          required: 'Table name is required'
        })}
        className='rounded border px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none'
        autoFocus
      />
      {errors.newTableName && (
        <span className='text-sm text-red-500'>
          {errors.newTableName.message}
        </span>
      )}
      <div className='flex gap-2'>
        <Button type='submit' size='sm' variant='outline'>
          Save
        </Button>
        <Button type='button' size='sm' variant='ghost' onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
