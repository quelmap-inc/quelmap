import { useState, memo } from 'react'
import { RenameTableForm } from './rename-table-form'

interface EditableTableNameProps {
  tableName: string
  onSuccess?: (newTableName: string) => void
  className?: string
}

export const EditableTableName = memo(
  ({ tableName, onSuccess, className }: EditableTableNameProps) => {
    const [isEditing, setIsEditing] = useState(false)

    if (isEditing) {
      return (
        <RenameTableForm
          tableName={tableName}
          onSuccess={(newName: string) => {
            onSuccess?.(newName)
            setIsEditing(false)
          }}
          onCancel={() => setIsEditing(false)}
        />
      )
    }

    return (
      <h2
        className={`cursor-pointer hover:text-blue-500 ${className || ''}`}
        onClick={() => setIsEditing(true)}
      >
        {tableName}
      </h2>
    )
  }
)
