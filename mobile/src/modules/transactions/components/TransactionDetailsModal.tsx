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
    handlePaySpecificInstallment,
    handleSaveEdit,
    handleDelete,
    installments,
    showInstallmentPicker,
    setShowInstallmentPicker,
  } = useTransactionModal(transaction, onUpdate, onClose, visible);

  // Formatador de valor para edição
  const formatAmountInput = (text: string): string => {
    // Remove tudo que não é número, ponto ou vírgula
    let cleaned = text.replace(/[^0-9,.]/g, '');
    
    // Se tiver múltiplos pontos/vírgulas, remove os antigos
    const dots = (cleaned.match(/\./g) || []).length;
    const commas = (cleaned.match(/,/g) || []).length;
    
    if (dots > 1) {
      cleaned = cleaned.replace(/\./g, '');
    }
    if (commas > 1) {
      cleaned = cleaned.slice(0, -1);
    }
    
    return cleaned;
  };

  const handleAmountChange = (text: string) => {
    const formatted = formatAmountInput(text);
    setEditedAmount(formatted);
  };

  React.useEffect(() => {
    syncState();
  }, [transaction, syncState]);

  return (
    <>
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
                    }).format(transaction.amount)}
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
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Parcelas</Text>
                      <Text style={styles.value}>
                        {transaction.installmentsPaid}/{transaction.installments}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Detalhes das Parcelas</Text>
                      <View style={{marginTop: 8}}>
                        {installments.map((installment) => (
                          <View
                            key={installment.id}
                            style={{
                              paddingVertical: 10,
                              paddingHorizontal: 10,
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: 6,
                              marginBottom: 8,
                              borderLeftWidth: 3,
                              borderLeftColor:
                                installment.status === 'completed'
                                  ? '#2ed573'
                                  : '#f1c40f',
                            }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}>
                              <Text style={{color: '#e8e8e8', fontWeight: '600'}}>
                                Parcela {installment.installmentNumber}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 11,
                                  color:
                                    installment.status === 'completed'
                                      ? '#2ed573'
                                      : '#f1c40f',
                                  fontWeight: '600',
                                }}>
                                {installment.status === 'completed'
                                  ? 'Paga'
                                  : 'Pendente'}
                              </Text>
                            </View>
                            <Text
                              style={{
                                color: '#999',
                                fontSize: 12,
                                marginTop: 4,
                              }}>
                              Valor: R${' '}
                              {parseFloat(installment.amount).toFixed(2)}
                            </Text>
                            <Text
                              style={{
                                color: '#999',
                                fontSize: 12,
                                marginTop: 2,
                              }}>
                              Vencimento:{' '}
                              {new Date(
                                installment.dueDate,
                              ).toLocaleDateString('pt-BR')}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </>
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
                    onChangeText={handleAmountChange}
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
                    onPress={
                      transaction.installments > 1
                        ? () => setShowInstallmentPicker(true)
                        : handleComplete
                    }
                    disabled={isLoading}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#0a0a0a" />
                    ) : (
                      <>
                        <View style={{ marginLeft: 8 }}>
                          <CheckCircle size={16} color="#0a0a0a" />
                        </View>
                        <Text style={styles.buttonText}>
                          {transaction.installments > 1
                            ? 'Pagar Parcela'
                            : 'Concluir'}
                        </Text>
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

    <Modal visible={showInstallmentPicker} transparent animationType="slide">
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Selecione a Parcela</Text>
            <Pressable
              onPress={() => setShowInstallmentPicker(false)}
              disabled={isLoading}>
              <X size={24} color="#e8e8e8" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{padding: 16, paddingBottom: 120}}>
              {installments
                .filter((inst) => inst.status === 'pending')
                .map((installment) => (
                  <Pressable
                    key={installment.id}
                    onPress={() =>
                      handlePaySpecificInstallment(installment.id)
                    }
                    disabled={isLoading}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 8,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: '#f1c40f',
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                      <View>
                        <Text style={{color: '#e8e8e8', fontWeight: '600'}}>
                          Parcela {installment.installmentNumber}
                        </Text>
                        <Text style={{color: '#999', fontSize: 12}}>
                          R$ {parseFloat(installment.amount).toFixed(2)}
                        </Text>
                        <Text style={{color: '#999', fontSize: 12}}>
                          Vencimento:{' '}
                          {new Date(
                            installment.dueDate,
                          ).toLocaleDateString('pt-BR')}
                        </Text>
                      </View>
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#f1c40f" />
                      ) : null}
                    </View>
                  </Pressable>
                ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
    </>
  );
}
