import React from 'react';
import {View, Text, Modal, Pressable, ScrollView, TextInput, ActivityIndicator} from 'react-native';
import {CheckCircle, Edit2, Trash2, X} from 'lucide-react-native';
import {Transaction} from '@services/api/transactions';
import {useTransactionModal} from './hooks/useTransactionModal';
import {styles} from './styles/TransactionDetailsModal.styles';

interface TransactionDetailsModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function TransactionDetailsModal({
  visible,
  transaction,
  onClose,
  onUpdate,
}: TransactionDetailsModalProps) {
  if (!transaction) return null;

  const {
    isEditing,
    setIsEditing,
    editedDescription,
    setEditedDescription,
    editedAmount,
    setEditedAmount,
    editedCategory,
    setEditedCategory,
    isLoading,
    syncState,
    handleComplete,
    handleSaveEdit,
    handleDelete,
  } = useTransactionModal(transaction, onUpdate, onClose);

  React.useEffect(() => {
    syncState();
  }, [transaction, syncState]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Detalhes da Despesa</Text>
            <Pressable onPress={onClose} disabled={isLoading}>
              <X size={24} color="#e8e8e8" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {!isEditing ? (
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Descrição</Text>
                  <Text style={styles.value}>{transaction.description}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Valor</Text>
                  <Text style={styles.value}>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(parseFloat(transaction.amount))}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Categoria</Text>
                  <Text style={styles.value}>{transaction.category}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Data</Text>
                  <Text style={styles.value}>
                    {new Date(transaction.transactionDate).toLocaleDateString('pt-BR')}
                  </Text>
                </View>

                {transaction.installments > 1 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Parcelas</Text>
                    <Text style={styles.value}>
                      {transaction.installmentsPaid}/{transaction.installments}
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Status</Text>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      backgroundColor:
                        transaction.status === 'completed'
                          ? 'rgba(46, 213, 115, 0.2)'
                          : 'rgba(241, 196, 15, 0.2)',
                      borderRadius: 4,
                      alignSelf: 'flex-start',
                    }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: transaction.status === 'completed' ? '#2ed573' : '#f1c40f',
                        fontWeight: '600',
                      }}>
                      {transaction.status === 'completed' ? 'Concluído' : 'Pendente'}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.editContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Descrição</Text>
                  <TextInput
                    style={styles.input}
                    value={editedDescription}
                    onChangeText={setEditedDescription}
                    placeholderTextColor="#666"
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Valor</Text>
                  <TextInput
                    style={styles.input}
                    value={editedAmount}
                    onChangeText={text => setEditedAmount(text.replace(/[^0-9.]/g, ''))}
                    placeholderTextColor="#666"
                    keyboardType="decimal-pad"
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Categoria</Text>
                  <TextInput
                    style={styles.input}
                    value={editedCategory}
                    onChangeText={setEditedCategory}
                    placeholderTextColor="#666"
                    editable={!isLoading}
                  />
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.actionButtons}>
            {!isEditing ? (
              <>
                {transaction.status !== 'completed' && (
                  <Pressable
                    style={[styles.button, styles.completeButton]}
                    onPress={handleComplete}
                    disabled={isLoading}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#0a0a0a" />
                    ) : (
                      <>
                        <CheckCircle size={18} color="#0a0a0a" />
                        <Text style={styles.buttonText}>Concluir</Text>
                      </>
                    )}
                  </Pressable>
                )}

                <Pressable
                  style={[styles.button, styles.editButton]}
                  onPress={() => setIsEditing(true)}
                  disabled={isLoading}>
                  <Edit2 size={18} color="#0a0a0a" />
                  <Text style={styles.buttonText}>Editar</Text>
                </Pressable>

                <Pressable
                  style={[styles.button, styles.deleteButton]}
                  onPress={handleDelete}
                  disabled={isLoading}>
                  <Trash2 size={18} color="#0a0a0a" />
                  <Text style={styles.buttonText}>Deletar</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  style={[styles.button, styles.completeButton]}
                  onPress={handleSaveEdit}
                  disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#0a0a0a" />
                  ) : (
                    <Text style={styles.buttonText}>Salvar</Text>
                  )}
                </Pressable>

                <Pressable
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setIsEditing(false)}
                  disabled={isLoading}>
                  <Text style={styles.buttonText}>Cancelar</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
